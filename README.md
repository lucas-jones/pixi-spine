# pixi-spine

#### This is a proof of concept to make `pixi-spine` work with the ES6 imports.
#### This also removes `PIXI` been use as a global.

## Usage

### Prebuilt Files

```js
import { Spine, AtlasParser } from 'pixi-spine';

Loader.registerPlugin(AtlasParser);

const spine = new Spine(...);
```

### Basic example

```js
import { Application } from 'pixi.js'
import { Spine, AtlasParser } from 'pixi-spine';

// Ensure AtlasParser is registered
Loader.registerPlugin(AtlasParser);

var app = new PIXI.Application();

document.body.appendChild(app.view);

app.loader
    .add('spineCharacter', 'spine-data-1/HERO.json')
    .load(function (loader, resources) {
        var animation = new Spine(resources.spineCharacter.spineData);

        // add the animation to the scene and render...
        app.stage.addChild(animation);

        // run
        var animation = new Spine(spineBoyData);
        if (animation.state.hasAnimation('run')) {
            // run forever, little boy!
            animation.state.setAnimation(0, 'run', true);
            // dont run too fast
            animation.state.timeScale = 0.1;
        }

        app.start();
    });
```
