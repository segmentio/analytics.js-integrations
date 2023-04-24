import { getSettings, loadAJS } from './utils';

const App = function(props) {
  const [loading, setLoading] = React.useState(false);
  const [wk, setWk] = React.useState('');
  const [ajsLoaded, setAjsLoaded] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const [editorVisible, setEditorVisible] = React.useState(false);
  const editor = React.useRef(null);

  React.useEffect(() => {
    const wk = localStorage.getItem('segWk');
    const settings = localStorage.getItem('segSettings');

    wk && setWk(wk);
    const settingsObject = JSON.parse(settings);

    if (wk && Object.keys(settingsObject).length) {
      // load AJS
      loadAJS(wk, settingsObject);
      setAjsLoaded(true);
      setEditorVisible(true);
    }

    const container = document.getElementById('jsoneditor');
    const options = {
      onChange: () => {
        setDirty(true);
      }
    };
    editor.current = new JSONEditor(container, options);
    editor.current.set(settingsObject);
    editor.current.expand({
      path: ['integrations'],
      isExpand: true,
      recursive: false
    });
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const settingsJSON = await getSettings(wk);
    const settings = JSON.stringify(settingsJSON, null, 2);
    localStorage.setItem('segWk', wk);
    localStorage.setItem('segSettings', settings);
    editor.current.set(settingsJSON);
    setLoading(false);
    setEditorVisible(true);

    if (ajsLoaded) {
      setDirty(true);
    } else {
      loadAJS(wk, settingsJSON);
      setAjsLoaded(true);
    }
  };

  const handleReload = () => {
    const settingsObject = editor.current.get();
    const settings = JSON.stringify(settingsObject);

    localStorage.setItem('segWk', wk);
    localStorage.setItem('segSettings', settings);
    location.reload();
  };

  return (
    <div>
      <form>
        <fieldset>
          <label htmlFor="writeKey">Writekey: </label>
          <input
            type="text"
            placeholder="Segment writekey"
            id="writeKey"
            onChange={e => {
              setWk(e.target.value);
            }}
            value={wk}
          />
          <input
            className="pure-button pure-button-primary"
            type="button"
            value="Fetch Writekey"
            onClick={loadSettings}
          />
          <input
            className="pure-button pure-button-primary"
            type="button"
            value="Reload and init AJS"
            onClick={handleReload}
            disabled={!dirty}
          />
        </fieldset>
      </form>
      <div
        id="jsoneditor"
        style={{ height: '90vh', display: editorVisible ? 'block' : 'none' }}
      ></div>
    </div>
  );
};

export default App;
