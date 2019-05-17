import { TextureAtlas } from "./core/TextureAtlas";
import { SkeletonJson } from "./core/SkeletonJson";
import { AtlasAttachmentLoader } from "./core/AtlasAttachmentLoader";
import { LoaderResource, BaseTexture, Texture, Loader } from "pixi.js";

function isJson(resource: LoaderResource) {
    return resource.type === LoaderResource.TYPE.JSON;
}

export class AtlasParser {
    static use(this: Loader, resource: LoaderResource, next: () => any) {
        // skip if no data, its not json, or it isn't atlas data
        if (!resource.data ||
            !isJson(resource) ||
            !resource.data.bones) {
            return next();
        }
        const metadata = resource.metadata || {};
        const metadataSkeletonScale = metadata ? resource.metadata.spineSkeletonScale : null;

        const metadataAtlas = metadata ? resource.metadata.spineAtlas : null;
        if (metadataAtlas === false) {
            return next();
        }
        if (metadataAtlas && metadataAtlas.pages) {
            //its an atlas!
            const spineJsonParser = new SkeletonJson(new AtlasAttachmentLoader(metadataAtlas));
            if (metadataSkeletonScale) {
                spineJsonParser.scale = metadataSkeletonScale;
            }
            const skeletonData = spineJsonParser.readSkeletonData(resource.data);

            resource.spineData = skeletonData;
            resource.spineAtlas = metadataAtlas;

            return next();
        }

        const metadataAtlasSuffix = metadata.spineAtlasSuffix || '.atlas';

        /**
         * use a bit of hackery to load the atlas file, here we assume that the .json, .atlas and .png files
         * that correspond to the spine file are in the same base URL and that the .json and .atlas files
         * have the same name
         */
        let atlasPath = resource.url
        let queryStringPos = atlasPath.indexOf('?')
        if (queryStringPos > 0) {
            //remove querystring
            atlasPath = atlasPath.substr(0, queryStringPos)
        }
        atlasPath = atlasPath.substr(0, atlasPath.lastIndexOf('.')) + metadataAtlasSuffix;
        // use atlas path as a params. (no need to use same atlas file name with json file name)
        if (resource.metadata && resource.metadata.spineAtlasFile) {
            atlasPath = resource.metadata.spineAtlasFile;
        }

        //remove the baseUrl
        atlasPath = atlasPath.replace(this.baseUrl, '');

        const atlasOptions = {
            crossOrigin: resource.crossOrigin,
            xhrType: LoaderResource.XHR_RESPONSE_TYPE.TEXT,
            metadata: metadata.spineMetadata || null,
            parentResource: resource
        };
        const imageOptions = {
            crossOrigin: resource.crossOrigin,
            metadata: metadata.imageMetadata || null,
            parentResource: resource
        };
        let baseUrl = resource.url.substr(0, resource.url.lastIndexOf('/') + 1);
        //remove the baseUrl
        baseUrl = baseUrl.replace(this.baseUrl, '');

        const namePrefix = metadata.imageNamePrefix || (resource.name + '_atlas_page_');

        const adapter = metadata.images ? staticImageLoader(metadata.images)
            : metadata.image ? staticImageLoader({ 'default': metadata.image })
                : metadata.imageLoader ? metadata.imageLoader(this, namePrefix, baseUrl, imageOptions)
                    : imageLoaderAdapter(this, namePrefix, baseUrl, imageOptions);

        const createSkeletonWithRawAtlas = function (rawData: string) {
            new TextureAtlas(rawData, adapter, function (spineAtlas) {
                if (spineAtlas) {
                    const spineJsonParser = new SkeletonJson(new AtlasAttachmentLoader(spineAtlas));
                    if (metadataSkeletonScale) {
                        spineJsonParser.scale = metadataSkeletonScale;
                    }
                    resource.spineData = spineJsonParser.readSkeletonData(resource.data);
                    resource.spineAtlas = spineAtlas;
                }
                next();
            });
        };

        if (resource.metadata && resource.metadata.atlasRawData) {
            createSkeletonWithRawAtlas(resource.metadata.atlasRawData)
        } else {
            this.add(resource.name + '_atlas', atlasPath, atlasOptions, function (atlasResource: any) {
                if (!atlasResource.error) {
                    createSkeletonWithRawAtlas(atlasResource.data);
                } else {
                    next();
                }
            });
        }
    }
}

export function imageLoaderAdapter(loader: any, namePrefix: any, baseUrl: any, imageOptions: any) {
    if (baseUrl && baseUrl.lastIndexOf('/') !== (baseUrl.length - 1)) {
        baseUrl += '/';
    }
    return function (line: string, callback: (baseTexture: BaseTexture) => any) {
        const name = namePrefix + line;
        const url = baseUrl + line;

        const cachedResource = loader.resources[name];
        if (cachedResource) {
            const done = () => {
                callback(cachedResource.texture.baseTexture)
            }

            if (cachedResource.texture) {
                done();
            }
            else {
                cachedResource.onAfterMiddleware.add(done);
            }
        } else {
            loader.add(name, url, imageOptions, (resource: LoaderResource) => {
                if (!resource.error) {
                callback(resource.texture.baseTexture);
                } else {
                callback(null);
                }
            });
        }
    }
}

export function syncImageLoaderAdapter(baseUrl: any, crossOrigin: any) {
    if (baseUrl && baseUrl.lastIndexOf('/') !== (baseUrl.length - 1)) {
        baseUrl += '/';
    }
    return function (line: any, callback: any) {
        callback(BaseTexture.from(line, crossOrigin));
    }
}

export function staticImageLoader(pages: { [key: string]: (BaseTexture | Texture) }) {
    return function (line: any, callback: any) {
        let page = pages[line] || pages['default'] as any;
        if (page && page.baseTexture)
            callback(page.baseTexture);
        else
            callback(page);
    }
}

if (Loader) {
    Loader.registerPlugin(AtlasParser);
}
