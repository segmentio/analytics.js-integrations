function dangerouslyAddScriptToDocument(path) {
  const script = document.createElement("script");
  script.src = path;
  document.body.appendChild(script);
}

class App extends React.Component {
  componentDidMount() {
    // Oh boy we're about to do a bad thing close your eyes
    dangerouslyAddScriptToDocument("/static/.ajs/analytics.js");
    dangerouslyAddScriptToDocument("/static/.ajs/platform.js");
  }

  render() {
    return <div>hi there!</div>;
  }
}

export default App;
