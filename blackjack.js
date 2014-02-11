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
      players[i].hand = deck.splice(0, cards);
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
    console.log(report(players));
  }

  function prepender(prefix) {
    return function(str) {
      return prefix + str;
    };
  }

  function inspectHand(player) {
    if(player.me) return player.hand;

    return [{number: '?', suit: '?'}].concat(player.hand.slice(1));
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

      return p(inspectHand(player).map(reportCard).join(','));
    }).map(prepender('  ')).join('\n');

    return "<Game \n" + result + ">";
  }

  play();
})(window);
