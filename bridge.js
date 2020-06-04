var SpotifyWebApi = require('spotify-web-api-node');
start();

var access_token,
    refresh_token,
    song_title = "",
    song_artist = "",
    song_image = "";
function start() {

  /**
   * Obtains parameters from the hash of the URL
   * @return Object
   */
  function getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while ( e = r.exec(q)) {
       hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  }

  var params = getHashParams();

  access_token = params.access_token;
      refresh_token = params.refresh_token;
      song_title = params.song_title;
      song_artist = params.song_artist;
      song_image = params.song_image;
      var error = params.error;

  if (error) {
    alert('There was an error during the authentication');
  } else {
    if (access_token) {
      console.log(song_title);
      // render oauth info
      document.getElementById('artist').innerHTML = song_artist;
      document.getElementById('title').innerHTML = song_title;
      document.getElementById('image').src = song_image;
      $.ajax({
          url: 'https://api.spotify.com/v1/me',
          headers: {
            'Authorization': 'Bearer ' + access_token
          },
          success: function(response) {
            $('#login').hide();
            $('#loggedin').show();
          }
      });
    } else {
        // render initial screen
        $('#login').show();
        $('#loggedin').hide();
    }
  }


}
setInterval(function update() {
    console.log('yes');
    var spotifyApi = new SpotifyWebApi();
    spotifyApi.setAccessToken(access_token);
    spotifyApi.getMyCurrentPlayingTrack().then(
      function (data) {
        song_title = data.body.item.name;
        song_artist = data.body.item.artists[0].name;
        song_image = data.body.item.album.images[1].url;
        document.getElementById('artist').innerHTML = song_artist;
        document.getElementById('title').innerHTML = song_title;
        document.getElementById('image').src = song_image;
      },
      function (err) {
        console.error(err);
      }
    );
}, 5000);
