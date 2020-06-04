var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var SpotifyWebApi = require('spotify-web-api-node');

var client_id = 'b38dd3b6a66345278f8fae19e221fc67'; // Your client id
var client_secret = '012ec4526ccb40ea98b7cc2acd65ebce'; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri
var access_token;
var song_title;
var song_artist;
var song_image;
var authOptions;
var spotifyApi = new SpotifyWebApi();
/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
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

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
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

// Electron
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

  // and load the index.html of the app.
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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
