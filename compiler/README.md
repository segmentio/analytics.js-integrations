# ajs-compiler
> A simple command line tool to compile a local copy of an a.js integration into a browserified version of analytics.js for testing purposes.

See the [wiki](https://github.com/segmentio/ajs-compiler/wiki) for help debugging common issues.

## Install

`npm install -g @segment/ajs-compiler`

## Usage

```bash
compile-ajs -h

  Usage: compile-ajs [options]


  Options:

    -s, --slug <slug>          Integration slug
    -S, --settings <settings>  Path to integration settings
    --with-server              Serve compiled ajs file from a local server
    -p, --port [port]          Set a port to serve the local ajs file from (default: 3000)
    -o, --out [out]            Path to write compiled ajs file to (default: ./)
    -w, --writeKey <writeKey>  Segment writeKey to for viewing events in the debugger
    -h, --help                 output usage information
```

## Settings File
In order for the compiler to work, you must provide settings for the integration you are testing. These settings must be a properly formatted JSON file with the integration's name as the top level key (ie. "Google Analytics", "Facebook Pixel", etc.). Here is an example:

```JSON
{
  "Facebook Pixel": {
    "legacyEvents": {
      "legacyEvent":"asdFrkj"
    },
    "standardEvents":{
    "standardEvent":"standard",
    "booking completed":"Purchase",
    "search":"Search"
    },
    "pixelId":"123123123",
    "agent":"test",
    "initWithExistingTraits":false
  }
}
```

The file can be named whatever you would like. The filename is passed as the value of the `--settings` flag.

## Examples

To compile and write as a file in your current working directory:

`compile-ajs --settings=settings.json --slug=google-analytics --writeKey=24jhh34jh923hjhj`

To compile and serve via a local HTTP server at port 8080:

`compile-ajs --settings=/path/to/settings.json --slug=google-analytics --writeKey=24jhh34jh923hjhj --withServer --port=8080`

To output the compiled file to a specific directory:

`compile-ajs --settings=settings.json --slug=google-analytics --writeKey=24jhh34jh923hjhj --out=/client/public/js`


