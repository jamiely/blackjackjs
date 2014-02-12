(function(root) {
  var STAY = 'stay';
  var HIT = 'hit';
  var moves = [STAY, HIT];

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
    return a;
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
    var renderer = new HtmlRenderer(document.getElementById('game'));

    firstDeal(deck, players);
    renderer.render({players: players});

    console.log(report(players));

    setTimeout(function() {
    runMonteCarlo({
      players: players,
      deck: deck
    }, 1);

    console.log(report(players));
    renderer.render({players: players});
    }, 1000);

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

  function reportCard(card) {
    return card.number + card.suit;
  }
  function reportPlayer(player) {
    function p(msg) {
      return "<Player " + player.name + ": " + msg + ">";
    }
    if(! player.hand || player.hand.length == 0) return p('No cards');

    var hand = inspectHand(player).map(reportCard).join(',') + " value=" + 
      pNested(handValues(player.hand)) + " busted?" + 
      (busted(player.hand) ? "yes" : "no") + " moves=" +
      possibleMoves(player);

    return p(hand);
  }

  function report(players) {
    var result = players.map(reportPlayer).
      map(prepender('  ')).join('\n');

    return "<Game \n" + result + 
      "\nwinners=" + winners(players).map(function(p){return p.name}) + 
      ">";
  }

  function dealerStayValue(val) {
    return val <= 21 && val >= 17;
  }
  function playerStayValue(val) {
    return val == 21;
  }

  function possibleMoves(player) {
    var vals = handValues(player.hand);
    if(vals.every(overBustedValue)) return [];
    if(player.dealer && vals.some(dealerStayValue)) return [STAY];
    if(vals.some(playerStayValue)) return [];

    return moves;
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

  function overBustedValue(val) {
    return val > 21;
  }

  function busted(hand) {
    return handValues(hand).every(overBustedValue);
  }

  function validHandValues(hand) {
    return handValues(hand).filter(function(v) { 
      return ! overBustedValue(v);
    });
  }

  function partitionByDealer(players) {
    return players.reduce(function(memo, player) {
      if(player.dealer) memo.dealer = player;
      else memo.nonDealers.push(player);
      return memo;
    }, {dealer: null, nonDealers: []});
  }

  function winnerIndices(players) {
    var ws = winners(players);
    var names = players.map(function(p){ return p.name});
    return ws.map(function(player) {
      return names.indexOf(player.name);
    });
  }

  function winners(players) {
    var parts = partitionByDealer(players);
    var dealer = parts.dealer;
    var nonBusted = parts.nonDealers.filter(function(player) {
      return ! busted(player.hand);
    });
    if(busted(dealer.hand)) return nonBusted;

    var dealerHandValue = Math.max.apply(null, validHandValues(dealer.hand));
    function beatDealer(player) {
      return validHandValues(player.hand).some(function(v) {
        return dealerStayValue(dealerHandValue) && 
          (v >= dealerHandValue || v == 21);
      });
    }

    return nonBusted.filter(beatDealer);
  }

  function clonePlayers(players) {
    return players.map(function(p) {
      var newP = {};
      for(var i in p) {
        newP[i] = p[i];
      }
      newP.hand = shallowClone(p.hand);

      return newP;
    });
  }

  function visibleCards(players, playerIndex) {
    return players.map(function(p){
      return p.hand;
    }).reduce(function (memo, hand, index) {
      var sliceIndex = playerIndex == index ? 0 : 1;
      memo.push.apply(memo, hand.slice(sliceIndex));
      return memo;
    }, []);
  }

  function monteCarloDeck(players, playerIndex) {
    var vis = visibleCards(players, playerIndex);
    function cacheKey(card) {
      return card.number + ':' + card.suit;
    }
    var cache = vis.reduce(function(memo, c) {
      memo[cacheKey(c)] = c;
      return memo;
    }, {});
    var deck = shallowClone(newDeck).filter(function(c) {
      return ! cache[cacheKey(c)];
    });

    shuffle(deck);
    // remove a number of cards equal to those unknown
    for(var i = 1; i < players.length; i++) deck.pop();

    return deck;
  }

  function runMonteCarlo(game, playerIndex) {
    var TRIALS = 1000;
    function whileHit(player, deckCopy) {
      do {
        var result = randomMove(player, deckCopy);
      } while(result.move == HIT);
    }
    //var deck = game.deck;
    var deck = monteCarloDeck(game.players, playerIndex);
    var ms = possibleMoves(game.players[playerIndex]);

    var results = ms.map(function(move) {
      var deckCopyA = shallowClone(deck);
      var playersA = clonePlayers(game.players);
      var playerA = playersA[playerIndex];
      makeMove(move, playerA, deckCopyA);

      var wins = 0, trials = 0;
      for(var i = 0; i < TRIALS; i++) {
        var playersB = clonePlayers(playersA);
        var playerB = playersB[playerIndex];
        var deckCopyB = shuffle(shallowClone(deckCopyA));
        if(move == HIT) whileHit(playerB, deckCopyB);

        // assume we never go back to a previous player
        for(var j = playerIndex + 1; j < playersB.length; j++) {
          whileHit(playersB[j], deckCopyB);
        }

        // at this point, everybody is done, so determine winners
        var ws = winnerIndices(playersB);
        var hasWon = ws.indexOf(playerIndex) != -1;

        if(hasWon) wins++;
        trials++;
      }

      return { 
        player: game.players[playerIndex],
        playerIndex: playerIndex,
        move: move,
        trials: trials,
        wins: wins
      }
    });

    console.log(reportResults(results));
    console.log('Player should ' + recommendedMove(results));

    return {
      results: results,
      recommendedMove: recommendedMove(results)
    };
  }

  function recommendedMove(results) {
    return results.reduce(function(item, result) {
      return result.wins > item.wins ? result : item;
    }, {move: null, wins: -1}).move;
  }

  function reportResults(results) {
    return results.map(function(result) {
      var txt = [];
      for(var i in result) { txt.push(i); }

      return txt.map(function(i) {
        return i + '=' + result[i];
      }).
        concat(['name=' + result.player.name]).
        join(', ');
    }).join('\n');
  }

  function makeMove(move, player, deck) {
    if(move == HIT) {
      hit(deck, player);
    }
  }

  function randomMove(player, deck) {
    var ms = possibleMoves(player);
    var rtn = {
      moves: ms,
      count: ms.length,
      move: null
    };
    if(rtn.count == 0) return rtn;

    var m = ms[Math.floor(Math.random() * ms.length)];
    makeMove(m, player, deck);
    rtn.move = m;
    return rtn;
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

  var HtmlRenderer = function(el) {
    function renderCard(card) {
      return '<div class="card">' + card.number + ' ' + card.suit + '</div>';
    }
    function renderBackface() {
      return '<div class="card facedown">? ?</div>';
    }
    function renderHand(hand, me) {
      return '<div class="hand">' +  
        (me ? hand.map(renderCard) : 
              [renderBackface()].concat(hand.slice(1).map(renderCard))).join('') + 
        '</div>';
    }

    function renderPlayer(player) {
      return '<div class="player"><div class="name">' + player.name + 
        '</div>' + renderHand(player.hand, player.me) + '</div>';
    }

    function renderGame(game) {
      return '<div class="game">' + game.players.map(renderPlayer).join('') +
        '</div>';
    }

    this.render = function(game) {
      el.innerHTML = renderGame(game);
    };
  };

  play();
})(window);
