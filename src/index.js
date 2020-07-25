import fs from 'fs';
import path from 'path';
import https from 'https';
import Flickr from 'flickr-sdk';
import Bluebird from 'bluebird';

// console.log([
//     process.env.FLICKR_CONSUMER_KEY,
//     process.env.FLICKR_CONSUMER_SECRET,
//     process.env.FLICKR_OAUTH_TOKEN,
//     process.env.FLICKR_OAUTH_TOKEN_SECRET,
// ]);

var oauth = new Flickr.OAuth(
    process.env.FLICKR_CONSUMER_KEY,
    process.env.FLICKR_CONSUMER_SECRET
);


var flickr = new Flickr(Flickr.OAuth.createPlugin(
    process.env.FLICKR_CONSUMER_KEY,
    process.env.FLICKR_CONSUMER_SECRET,
    process.env.FLICKR_OAUTH_TOKEN,
    process.env.FLICKR_OAUTH_TOKEN_SECRET,
));

// console.log({ oauth, flickr });

function downloadFile(url, path) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(path);

        file.on('finish', () => {
            file.close(resolve);
        })

        https
            .get(url, (res) => {
                res.pipe(file);
            })
            .on('error', () => {
                fs.unlink(path);
                reject(err);
            })
        ;
    });
}

async function downloadPhotos(downloadPage = 1) {
    const res = await flickr.photosets.getPhotos({
        user_id: '22718938@N08',
        photoset_id: '72157649796941864',
        per_page: 15,
        page: downloadPage,
        extras: 'url_o',
    });
    const { photoset } = res.body;
    const { photo: photos, page: pageStr, pages: pagesStr } = photoset;
    const page = parseInt(pageStr, 10);
    const pages = parseInt(pagesStr, 10);

    Bluebird.map(
        photos,
        ({ url_o: url }, index) => {
            const fileName = path.basename(url);
            const filePath = path.join(__dirname, '../images-02/', fileName);

            console.log(`${page}.${index}. Download: ${fileName}`);

            return downloadFile(url, filePath);
        },
        { concurrency: 2 },
    );

    if (page < pages) {
        await downloadPhotos(page + 1);
    }
}

(async () => {
    try {
        // const { oauth_token: oauthToken, oauth_token_secret: oauthTokenSecret } = (await oauth.request('http://localhost:3000/oauth/callback')).body;
        // console.log({ oauthToken, oauthTokenSecret });
        // console.log(oauth.authorizeUrl(oauthToken));
        // const oauthToken = process.env.FLICKR_OAUTH_TOKEN;
        // const oauthTokenSecret = process.env.FLICKR_OAUTH_TOKEN_SECRET;
        // const oauthVerifier = '39ae6cd090ae4c68';
        // console.log((await oauth.verify(oauthToken, oauthVerifier, oauthTokenSecret)).body);

        // console.log((await flickr.test.login()).body);
        // console.log((await flickr.activity.userPhotos()).body);
        // console.dir((await flickr.photosets.getList()).body.photosets.photoset, { depth: null });
        // console.dir((await flickr.photosets.getPhotos({ user_id: '22718938@N08', photoset_id: '72157649796941864', per_page: 1, extras: 'url_o' })).body, { depth: null });
        // console.dir((await flickr.photosets.getContext({ photo_id: '17054021598', photoset_id: '72157649796941864' })).body, { depth: null });
        // console.dir((await flickr.photos.getContext({ photo_id: '17054021598' })).body, { depth: null });
        // console.dir((await flickr.photos.getInfo({ photo_id: '17054021598' })).body.photo.urls, { depth: null });
        // console.dir((await flickr.photos.getSizes({ photo_id: '17054021598' })).body.sizes.size, { depth: null });
        // console.log((await flickr.galleries.getList({ user_id: '22718938@N08' })).body);


        await downloadPhotos(1);
        
    } catch (e) {
        console.error(e.message);
    }
})();
