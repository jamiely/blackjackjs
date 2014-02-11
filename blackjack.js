(function(root) {
  var numbers = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  var suits = ['♣', '♥', '♦', '♠'];
  var newDeck = [];
  for(var i = 0; i < numbers.length; i++) {
    for(var j = 0; j < suits.length; j++) {
      newDeck.push({
        number: numbers[i],
        suit: suits[j]
      });
    }
  }

  // Fisher-Yates shuffle in-place
  function shuffle(a) {
    for(var i = a.length - 1; i >= 1; i --) {
      var j = Math.floor(Math.random() * i);
      var swap = a[i];
      a[i] = a[j];
      a[j] = swap;
    }
  }

  function newPlayers(count) {
    var players = [];
    for(var i = 0; i < count-1; i++) {
      players.push({
        name: String.fromCharCode(65+i),
        hand: null,
        dealer: false,
        me: i == 0
      });
    }
    players.push({
      name: 'Dealer',
      hand: null,
      dealer: true
    });
    return players;
  }

  // pass the number of regular decks you want to use
  function newBlackjackDeck(deckCount){
    var decks = [];
    for(var i = 0; i < deckCount; i++) {
      decks.push.apply(decks, newDeck.slice(0));
    }
    shuffle(decks);
    return decks;
  }

  function deal(deck, players, cards) {
    for(var i = 0; i < players.length; i ++) {
      var hand = players[i].hand || [];
      hand.push.apply(hand, deck.splice(0, cards));
      players[i].hand = hand;
    }
  }

  function firstDeal(deck, players) {
    deal(deck, players, 2);
  }

  function hit(deck, player) {
    deal(deck, [player], 1);
  }

  function play() {
    var deck = newBlackjackDeck(6);
    var players = newPlayers(4);
    firstDeal(deck, players);
    // test busting
    deal(deck, players, 1);
    console.log(report(players));
  }

  function prepender(prefix) {
    return function(str) {
      return prefix + str;
    };
  }

  function inspectHand(player) {
    return player.hand;
  }

  function pNested(arr) {
    if(! (arr instanceof Array)) return arr + '';

    return '[' + arr.map(function(a) {
      return pNested(a);
    }) + ']';
  }

  function report(players) {
    function reportCard(card) {
      return card.number + card.suit;
    }

    var result = players.map(function(player) {
      function p(msg) {
        return "<Player " + player.name + ": " + msg + ">";
      }
      if(! player.hand || player.hand.length == 0) return p('No cards');

      var hand = inspectHand(player).map(reportCard).join(',') + " value=" + 
        pNested(handValues(player.hand)) + " busted? " + 
        (busted(player.hand) ? "yes" : "no");

      return p(hand);
    }).map(prepender('  ')).join('\n');

    return "<Game \n" + result + ">";
  }

  function cardValues(card) {
    if(card.number == 'A') return [1, 11];
    if(['J', 'Q', 'K'].indexOf(card.number) != -1) return [10];
    return [parseInt(card.number)];
  }

  function handValues(hand) {
    function merge(m, arr) {
      m.push.apply(m, arr);
      return m;
    }
    function inner(memo, rest) {
      if(rest.length == 0) return memo;

      return rest[0].map(function(cardValue) {
        return inner(memo.map(function(hand) {
          return hand.concat([cardValue]);
        }), rest.slice(1));
      }).reduce(merge, []);
    }
    function sum(vals) {
      return vals.reduce(function(s, i) { return s + i; }, 0);
    }
    return inner([[]], hand.map(cardValues)).map(sum);
  }

  function busted(hand) {
    return handValues(hand).every(function(val) {
      return val > 21;
    });
  }

  function runMonteCarlo(game) {
    // get the moves for the current player
    // for each of the moves
    //   make the move 
    //   randomly play out the rest of the game
    //   do this maybe 1000 times each
    //   determine win loss percentage
  }

  function shallowClone(a) {
    if(a instanceof Array) return a.slice(0);
    if(typeof a == 'object') {
      var c = {};
      for(var i in a) {
        c[i] = a[i];
      }
      return c;
    }
    return a;
  }

  play();
})(window);
