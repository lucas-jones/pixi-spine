# pixi-spine

#### This is a proof of concept to make `pixi-spine` work with the ES6 imports.
#### This also removes `PIXI` been use as a global.

## Usage

### Basic example

```js
import { Application, Loader, IResourceDictionary } from 'pixi.js'
import { Spine, AtlasParser } from 'pixi-spine';

// This is important to ensure Pixi loaders know how to load Spine files
Loader.registerPlugin(AtlasParser);

var app = new Application();

document.body.appendChild(app.view);

app.loader
    .add('spine', 'spine.json')
    .load(function (loader: Loader, resources: IResourceDictionary) {
		var spine = new Spine(resources['spine'].spineData);

        // Add the spine to the scene and render...
        app.stage.addChild(spine);

		// Position
		spine.position.set(app.screen.width / 2, app.screen.height / 2);
		spine.scale.set(0.5, 0.5);

		spine.state.setAnimation(0, "RUN", true);

        app.start();
    });
```
