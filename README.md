# Hackmidi

A JavaScript library to play MIDI files in Edge, Firefox, Safari, and Chrome.

A fork of [midihackery](https://github.com/Treeki/midihackery.js).
Powered by [libtimidity](http://libtimidity.sourceforge.net).
Used in [Hacklily](https://www.hacklily.org).

## Installation

```
npm install hackmidi --save
```

## Usage

`import {playerFromMIDIBuffer} from "hackmidi";

fetch("Chop-28-4.mid")
  .then(response => response.arrayBuffer())
  .then(buffer => playerFromMIDIBuffer(buffer, "samples/"))
  .then(player => {
    player.addChangeListener((timeInSeconds, isPlaying) => {
      console.log(timeInSeconds, isPlaying);  // (0, false)
    });

    player.play();

    // ...
    
    player.pause();

    // ...
    
    player.seek(20.5 /* seconds */);
  });``
```

## Demo

See [https://www.hacklily.org/hackmidi](https://www.hacklily.org/hackmidi).

