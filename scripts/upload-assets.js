const S3 = require('aws-sdk/clients/s3');
const fs = require('fs-extra');
const path = require('path');
const logUpdate = require('log-update');
const zlib = require('zlib');

/**
 * Recursively loads a list of files based on
 * a base path
 */
async function getFiles(dir) {
  const subdirs = await fs.readdir(dir);
  const files = await Promise.all(
    subdirs.map(async subdir => {
      const res = path.resolve(dir, subdir);
      return (await fs.stat(res)).isDirectory() ? getFiles(res) : [res];
    })
  );
  return files.reduce((a, f) => a.concat(f, []));
}

/**
 * Uploads all assets in a local path to a remote bucket,
 * diffing all existing files by name agains the remote
 * folder
 */
async function uploadAssets() {
  const localPath = process.env.LOCAL_PATH;

  const bucket = process.env.S3_BUCKET_NAME;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const sessionToken = process.env.AWS_SESSION_TOKEN;
  const branch = process.env.BUILDKITE_BRANCH || 'master';

  const cfCanonicalUserIds = process.env.CF_CUIDS;
  const platformCanonicalUserId = process.env.PLAT_CUID;
  const cfCanonicalUserIdsParsed = cfCanonicalUserIds
    .split(',')
    .map(i => `id=${i}`)
    .join(',');

  if (bucket === undefined) {
    throw new Error('bucket required');
  }
  if (localPath === undefined) {
    throw new Error('Local Path required');
  }

  const s3 = new S3({
    accessKeyId,
    secretAccessKey,
    sessionToken,
    region: 'us-west-2'
  });

  const absolutePaths = await getFiles(localPath);
  const relativeFiles = absolutePaths.map(a =>
    path.relative(process.cwd(), a).replace(localPath, '')
  );

  const total = relativeFiles.length;
  let progress = 0;

  logUpdate(`Progress: ${progress}/${total}`);

  let manifest = {};

  const key = (fileName) => {
    return path.join('next-integrations', fileName)
  };

  const putObject = async (
    fileName,
    uploadPath = undefined,
    cached = false
  ) => {
    const filePath = path.join(localPath, fileName);

    const options = {
      Bucket: bucket,
      Key: key(uploadPath || fileName).replace('//', '/'),
      Body: await fs.readFile(filePath),
      ContentType: 'application/javascript',
      GrantRead: cfCanonicalUserIdsParsed,
      GrantFullControl: `id=${platformCanonicalUserId}`
    };

    if (filePath.includes('.gz')) {
      options.ContentEncoding = 'gzip';
    }

    if (cached) {
      options.CacheControl = 'public,max-age=31536000,immutable';
    }

    return s3.putObject(options).promise();
  };

  const uploads = relativeFiles.map(async fileName => {
    const isVendor = fileName.includes('vendor');

    if (isVendor) {
      return putObject(fileName);
    }

    const f = fileName.split('/');
    const type = f[1]; // get integration name
    const integration = f[2]; // get integration name
    const file = f[f.length - 1];

    const package = await fs.readJSON(`${type}/${integration}/package.json`);
    const version = package.version;
    const filePath = path.join(localPath, fileName);

    await putObject(fileName);
    await putObject(
      fileName,
      `${type}/${integration}/${version}/${file}`,
      true
    );

    progress++;

    manifest[`${type}/${integration}`] = version;

    logUpdate(filePath);
    logUpdate(`Progress: ${progress}/${total}`);
  });

  await Promise.all(uploads);

  await s3 // upload manifest file
    .putObject({
      Bucket: bucket,
      Key: key('/manifest.json'),
      Body: zlib.gzipSync(JSON.stringify(manifest)),
      ContentEncoding: process.env.CONTENT_ENCODING,
      GrantRead: cfCanonicalUserIdsParsed,
      GrantFullControl: `id=${platformCanonicalUserId}`,
      ContentType: 'application/json'
    })
    .promise();
}

(async function main() {
  try {
    await uploadAssets();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
