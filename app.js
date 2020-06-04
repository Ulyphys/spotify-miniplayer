var express = require('express');
var request = require('request'); 
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var SpotifyWebApi = require('spotify-web-api-node');
//Change these properties to match yours using Spotify's developer panel.
var client_id = 'client-id'; // Your client id
var client_secret = 'client-secret'; // Your secret
var redirect_uri = 'redirect-uri'; // Your redirect uri
var access_token;
var song_title;
var song_artist;
var song_image;
var authOptions;
var spotifyApi = new SpotifyWebApi();

var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var server = express();

server.use(express.static(__dirname))
   .use(cors())
   .use(cookieParser());

server.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email user-read-currently-playing user-read-playback-state' ;
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});
server.get('/callback', function(req, res) {


  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        access_token = body.access_token;
        //setting up the spotifyApi here for use, the access token gets accesed by bridge later.
        spotifyApi.setAccessToken(access_token);

        spotifyApi.getMyCurrentPlayingTrack().then(
          function (data) {
            song_title = data.body.item.name;
            song_artist = data.body.item.artists[0].name;
            song_image = data.body.item.album.images[1].url;
            console.log(data);

            res.redirect('/#' +
              querystring.stringify({
                access_token: access_token,
                song_title: song_title,
                song_artist: song_artist,
                song_image: song_image
              }));
          },
          function (err) {
            console.error(err);
          }
        );

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        request.get(options, function(error, response, body) {
          console.log("sucess!");
        });
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }

});

console.log('Listening on 8888');
server.listen(8888);

// Electron, this basically hosts the window for the program (client). Everything before dealt with the server
// and ran using express
const electron = require('electron');
const { app, BrowserWindow } = require('electron')

function createWindow () {


  // Create the browser window.
  const win = new BrowserWindow({
    width: 600,
    height: 100,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // and load the index.html of the app. (change this to wherever the server is hosted
  win.loadURL('http://localhost:8888/')

  const globalShortcut = electron.globalShortcut

  globalShortcut.register('f5', function() {
    console.log('f5 is pressed')
    win.reload()
  })
  globalShortcut.register('CommandOrControl+R', function() {
    console.log('CommandOrControl+R is pressed')
    win.reload()
  })
  // Open the DevTools
  // win.webContents.openDevTools()
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
