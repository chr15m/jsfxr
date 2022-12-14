Quick 'n' easy game sound effects generator.

App 👉 https://sfxr.me

[About](#about) | [Use as a library](#library) | [Jsfxr Pro](#jsfxr-pro)

# About

A port of [sfxr](http://www.drpetter.se/project_sfxr.html) to HTML5 by Eric Fredricksen.
Maintained by Chris McCormick.

![jsfxr screenshot](screenshot.png)

# Library

You can use the jsxfr library to generate and play sounds in your JavaScript game code.

## Node

Install it:

```
npm i jsfxr
```

Require it:

```
const sfxr = require("jsfxr").sfxr;
```

See [API](#API) below for usage examples.

## Browser

Include the scripts in your page:

```
<script src="https://sfxr.me/riffwave.js"></script>
<script src="https://sfxr.me/sfxr.js"></script>
```

You can then directly use the `sfxr` namespace without requiring it.

## API

Generate a sound effect using a preset algorithm and play it using webaudio API.

```javascript
const sfxr = require("jsfxr").sfxr;

const preset = "pickupCoin";
const sound = sfxr.generate(preset);

sfxr.play(sound);
```

Available presets are `pickupCoin`, `laserShoot`, `explosion`, `powerUp`, `hitHurt`, `jump`, `blipSelect`, `synth`, `tone`, `click`, and `random`.

You can also use the interface at https://sfxr.me to find the sound you want and then use the sound definition.
Click the "serialize" button and copy the JSON code for the sound you want.
You will get a datastructure that you can use like this:

```javascript
var sound = {
  "oldParams": true,
  "wave_type": 1,
  "p_env_attack": 0,
  "p_env_sustain": 0.31718502829007483,
  "p_env_punch": 0,
  "p_env_decay": 0.2718540993592685,
  "p_base_freq": 0.2612<F2>6191208337196,
  "p_freq_limit": 0,
  "p_freq_ramp": 0.43787689856926615,
  "p_freq_dramp": 0,
  "p_vib_strength": 0,
  "p_vib_speed": 0,
  "p_arp_mod": 0,
  "p_arp_speed": 0,
  "p_duty": 1,
  "p_duty_ramp": 0,
  "p_repeat_speed": 0.7558565452384385,
  "p_pha_offset": 0,
  "p_pha_ramp": 0,
  "p_lpf_freq": 1,
  "p_lpf_ramp": 0,
  "p_lpf_resonance": 0,
  "p_hpf_freq": 0,
  "p_hpf_ramp": 0,
  "sound_vol": 0.25,
  "sample_rate": 44100,
  "sample_size": 8
};

var a = sfxr.toAudio(sound);
a.play();
```

You can also use the short URL compressed version of the sound:

```javascript
var a = sfxr.toAudio("5EoyNVSymuxD8s7HP1ixqdaCn5uVGEgwQ3kJBR7bSoApFQzm7E4zZPW2EcXm3jmNdTtTPeDuvwjY8z4exqaXz3NGBHRKBx3igYfBBMRBxDALhBSvzkF6VE2Pv");
a.play();
```

You can also access an array of samples.
By default the buffer contains audio rendered at a sample rate of `44100`.

```
var buffer = sfxr.toBuffer(sound);
console.log(buffer);
```

You can convert between the base58 short-url encoded format and JSON using `b58encode` and `b58decode`:

```
var b58string = sfxr.b58encode(sound);
var sound = sfxr.b58decode(b58string);
```

You can also access the lower level classes `SoundEffect` and `Params` if you need to.
This can be useful for caching the internal representation for efficiency, or mutating the sound with `params.mutate()`.

# Jsfxr Pro

A [Pro version of Jsfxr](https://pro.sfxr.me/) is available with enhanced features like the ability to save sounds to packs and download a zip file of all wavs.

[![Jsfxr Pro Screenshot](./jsfxr-pro-screenshot.png)](https://pro.sfxr.me)

# Links

* Application:  http://sfxr.me/
* Source code:  https://github.com/chr15m/jsfxr/

# Thanks

* Dr. Petter for inventing sfxr.
* Eric Fredricksen for creating this port.
* riffwave.js: http://www.codebase.es/riffwave/
* jquery-ui:   http://jqueryui.com/
