BIN := ./node_modules/.bin

# The Platform Canonical User IDs and Cloudfront Canonical User IDs copied from ajs-renderer. They allow Cloudfront distributions to access objects in the S3 bucket:
# https://github.com/segmentio/ajs-renderer/blob/aef7f4a39a948bb04beb81cf673ea68a2811a016/.run/ajs-renderer.yml#L55-L57
# CF_CUIDs taken from CloudFront Origin Access Identities for cdn.segment.build and custom domain
upload-assets:
	S3_BUCKET_NAME=segment-ajs-next-destinations-stage \
	LOCAL_PATH=build \
	CONTENT_ENCODING=gzip \
	PLAT_CUID="71021d9dc4637cc0f664721a086f12d5407daa936de96b588f9682035f907708" \
	CF_CUIDS="61309ae3032bd74dd97e761e16bd899f3dc85bf54cd39aa195cadfcc369ca90eb79a63ad1906c35c45f1196dca82f790,8105d109960ae15aa4b175b24d3b21259596258a1e2e8219842bde30eb11eee6969ea4de9e735ab487ba054cdaa880b7,d0f4e4f9d150e887bf5f3d982fcc52b5195fd02371644cdc79f024dffc4ce59c525981f5639802c6081c9b770e6696f8" \
	node scripts/upload-assets.js
.PHONY: upload-assets

# The Platform Canonical User IDs and Cloudfront Canonical User IDs copied from ajs-renderer. They allow Cloudfront distributions to access objects in the S3 bucket:
# https://github.com/segmentio/ajs-renderer/blob/aef7f4a39a948bb04beb81cf673ea68a2811a016/.run/ajs-renderer.yml#L73-L76
# CF_CUIDs taken from CloudFront Origin Access Identities for cdn.segment.com and cdn.segment.io and custom domain
publish-assets:
	S3_BUCKET_NAME=segment-ajs-next-destinations-production \
	LOCAL_PATH=build \
	CONTENT_ENCODING=gzip \
	PLAT_CUID="71021d9dc4637cc0f664721a086f12d5407daa936de96b588f9682035f907708" \
	CF_CUIDS="658a52e6b37b52aa20ecc18a60876cb31750139de6379a76f05f57f510a46255b85d99fcb9e3eb996b37fca525b966e7,a81d36a9a042396b69ea0081400a4c68041762d1a09943b24f65b879041df89a3dc77374aa705f5b2d035da7e12ce3da,f5304a60592a83540a9a6254c1967d95df993f685a684dc8885bfa1a50735da3d9cf9752f489ba6f9fc552ab1af35797" \
	node scripts/upload-assets.js
.PHONY: upload-assets

build: 
	yarn build
	node ./scripts/build-shells.js
.PHONY: build

build-and-upload: build
	make upload-assets
.PHONY: build-and-upload

build-and-publish: build
	make publish-assets
.PHONY: build-and-publish

local-server:
	yarn build
	node ./scripts/build-shells.js
	npx serve
.PHONY: local-server