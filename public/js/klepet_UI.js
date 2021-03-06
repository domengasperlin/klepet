function divElementEnostavniTekst(sporocilo) {
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
  var jeSlika = (/(http(s?):)([/|.|\w|\S])*\.(?:jpg|gif|png)/g).test(sporocilo);
  var youtubeS = ((/https:\/\/www\.youtube\.com\/watch\?v=(.{11})/g).test(sporocilo));  
  if (jeSmesko || jeSlika || youtubeS) {
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace(/&lt;img/g, '<img').replace(/png\' \/&gt;/g, 'png\' />');
    sporocilo = sporocilo.replace(/https:\/\/www\.youtube\.com\/watch\?v=(.{11})/g, '$&<br><div style="padding-left:20px;"><iframe width="200px" height="150px" src="https://www.youtube.com/embed/$1" allowfullscreen></iframe></div>');
    var reMatch = /OIS\/gradivo\/.+(?:png'|jpg'|gif')/;
    var match = reMatch.exec(sporocilo);//   OIS/gradivo/smiley.png'
    sporocilo = sporocilo.replace(/http:\/\/sandbox.lavbic.net\/teaching\/OIS\/gradivo\/.+(?:png'|jpg'|gif')/,'http://sandbox.lavbic.net/teaching/')// sandbox.lavbic.net/teaching/OIS/gradivo/smiley.png  
    sporocilo = sporocilo.replace(/(http(s?):)([/|.|\w|\S])*\.(?:jpg|gif|png)/g,'$& <br><img src="$&" width="200px" style="padding-left:20px" /><br>')
    sporocilo = sporocilo.replace(/http:\/\/sandbox.lavbic.net\/teaching\//,"http://sandbox.lavbic.net/teaching/"+match+"'");
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  }
  else {
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }

}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}
function divElementHtmlSlika(tekst) {
 return $('<div></div>').html('<img src="' + tekst + '" style="padding-left:20px;');
}
function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  sporocilo = dodajSmeske(sporocilo);
  var sistemskoSporocilo;

  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
    }
  } else {
    
    sporocilo = filtirirajVulgarneBesede(sporocilo);

    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }

  $('#poslji-sporocilo').val('');
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);
    
  });
  socket.on('dregljaj',function() {
     $('#vsebina').jrumble();
    //klepetApp.procesirajUkaz('/dregljaj ' + $(this).text());
     $('#vsebina').trigger('startRumble');
      window.setTimeout(function() {
      $('#vsebina').trigger('stopRumble');
      },1500);
  })
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }
     $('#seznam-uporabnikov div').click(function() {
       document.getElementById("poslji-sporocilo").value = "/zasebno " + '"'+$(this).text()+'"';
      $('#poslji-sporocilo').focus();
    });
    
  });

  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}
