# ajs-cli
> Makes ajs testing a piece of cake! 🍰

`ajs-cli` exists to help you test analytics.js integrations simply and easily.

## Install 

```sh
$ alias ajs=~/path/to/analytics.js-private/cli/index.js
```

## Usage

First, cd into the directory of the integration you'd like to test. We'll use convertro as an example here.

```sh
$ cd ~/path/to/analytics.js-integrations/integrations/convertro
```

Then, we'll generate the relevant settings information for the integration with:

```sh
$ ajs sync convertro
```

This generates a `~/.ajs.settings.json` file in your home directory. If you already have this file, it'll add add it as a key in json. 

```sh
$ cat ~/.ajs.settings.json
{
  "convertro": {
     ...
  }
}
```

If you want to add settings or change existing ones, just edit that file.

Finally, we can run create a testing website with:

```sh
$ ajs up
```

Then you can connect to it on localhost:3000

