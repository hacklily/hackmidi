/* eslint-disable jsx-a11y/anchor-is-valid */

import React, {Component} from 'react';
import './App.css';

import {playerFromMIDIBuffer} from "hackmidi";

const importSrc =
  `// Click a link in the example below to run that line.


import {playerFromMIDIBuffer} from "hackmidi";

`;

const fetchSrc =
  `fetch("Chop-28-4.mid")
`;

const parseSrc =
  `  .then(response => response.arrayBuffer())
  .then(buffer => playerFromMIDIBuffer(buffer, "samples/"))
  .then(player => {
    player.addChangeListener((timeInSeconds, isPlaying) => {
      console.log(timeInSeconds, isPlaying);`;

const parseContinued = `
    });

`;

const playSpace = "    ";
const playSrc = `player.play();
`;

const space =
  `
    // ...
    
    `;

const pauseSrc = `player.pause();
`;

const seekSrc = `player.seek(20.5 /* seconds */);
`;

const destroySrc = `player.destroy();
`;

const endSrc = `  });


// Want to use this in your own project?
//
//  1. Run \`npm install hackmidi --save\` to add Hackmidi to
//     your webpack project. Confused? Create an app using
//     https://github.com/facebookincubator/create-react-app
//     and then run that npm install command.
//  2. Serve some samples (patches) somewhere. You can steal
//     them from the docs/public folder in
//     https://github.com/hacklily/hackmidi or an installation
//     of timidity.
//  3. Copy and paste the code above and bend it to your will.
`;

class App extends Component {
  state = {
    fetched: false,
    readyToPlay: false,
    readyToPause: false,
    timeSec: undefined,
    playing: undefined,
  }
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Hackmidi</h1>
          <p>
            A JavaScript library to play MIDI files in
            Edge, Firefox, Safari, and Chrome.
          </p>
          <p>
            A fork of <a href="https://github.com/Treeki/midihackery.js">midihackery</a>.
            Powered by <a href="http://libtimidity.sourceforge.net">libtimidity</a>.
            Used in <a href="https://www.hacklily.org">Hacklily</a>.
          </p>
        </header>
        <div className="App-intro">
          <pre>
            {importSrc}
            {this.state.fetched ? fetchSrc :
              <a href="#" onClick={this._loadChopin}>
                {fetchSrc}
              </a>}
            {parseSrc}{!isNaN(this.state.timeSec) &&
              `  // (${this.state.timeSec}, ${this.state.playing})`}
            {parseContinued}
            {playSpace}{this.state.readyToPlay ?
              <a href="#" onClick={this._playChopin}>
                {playSrc}
              </a> : playSrc}
            {space}{this.state.readyToPause ?
              <a href="#" onClick={this._pauseChopin}>
                {pauseSrc}
              </a> : pauseSrc}
            {space}{this.state.readyToPause || this.state.readyToPlay ?
              <a href="#" onClick={this._seekChopin}>
                {seekSrc}
              </a> : seekSrc}
            {space}{this.state.readyToPause || this.state.readyToPlay ?
              <a href="#" onClick={this._destroyChopin}>
                {destroySrc}
              </a> : destroySrc}
            {endSrc}
          </pre>
        </div>
      </div>
    );
  }

  _loadChopin = () => {
    this.setState({
      fetched: true,
    });

    fetch(`${process.env.PUBLIC_URL}/Chop-28-4.mid`)
      .then(response => response.arrayBuffer())
      .then(buffer => playerFromMIDIBuffer(buffer, `${process.env.PUBLIC_URL}/samples/`))
      .then(player => {
        this.setState({
          readyToPlay: true,
        });
        this._player = player;
        player.addChangeListener(this._handleChangeListener);
      });
  }

  _handleChangeListener = (timeSec, playing) => {
    this.setState({
      timeSec,
      playing,
      readyToPlay: !playing,
      readyToPause: playing,
    });
  }

  _playChopin = () => {
    this._player.play();
  }

  _pauseChopin = () => {
    this._player.pause();
  }

  _seekChopin = () => {
    this._player.seek(20.5);
  }

  _destroyChopin = () => {
    this.setState({
      fetched: false,
      readyToPlay: false,
      readyToPause: false,
      timeSec: undefined,
      playing: undefined,
    });
    this._player.destroy();
    this._player = null;
  }
}

export default App;
