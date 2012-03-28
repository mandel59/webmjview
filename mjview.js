function charWidthRegulation(str){
  var len = str.length;
  for(var i = 0; i < len; i++){
    c = str.charCodeAt(i);
    if(0xFF00 < c && c < 0xFF5F) {
      str = str.substring(0, i) + String.fromCharCode(c - 0xFF00 + 0x20)
          + str.substring(i+1);
    }
  }
  return str;
}
function zeronum(n, digits){
  return (new Array(digits).join("0") + n.toString()).slice(-digits);
}
function MJURIPath(mj){
  var a = parseInt(mj.substring(2), 10);
  var c = zeronum(Math.floor((a-1)/1000)*1000+1, 5);
  return c + "/mj" + zeronum(a, 6);
}
function MJSVGURI(mj){
  return "http://ossipedia.ipa.go.jp/ipamjfont/mjmojiichiran/SVGfiles/" + MJURIPath(mj) + ".svg";
}
function MJImageURI(mj){
  return "http://ossipedia.ipa.go.jp/ipamjfont/mjmojiichiran/PNGfiles/" + MJURIPath(mj) + ".png";
}
function MJURIList(mj){
  return [/*MJSVGURI(mj), */MJImageURI(mj)];
  /*  browser can't show the svg file because the server returns it as text/xml */
}

function KangXiRadical(radical) {
  return String.fromCharCode(0x2F00 + radical - 1);
}

function IsIVSSupported() {
  if($.browser) {
    if($.browser.mozilla && parseFloat($.browser.version.match(/\d+(\.\d+)?/)) > 3.9 )
      return true;
    if($.browser.opera && navigator.userAgent.indexOf("Win") != -1)
      return true;
    if($.browser.msie && parseInt($.browser.version.match(/\d+/),10) > 9 )
      return true;
  }
  return false;
}

function IsKana(str) {
  var code = str.charCodeAt(0);
  return (0x3040 < code && code < 0x3097) || (0x30A0 < code && code < 0x30FB);
}

function ExGlyph(url, exglyph){
  if(!exglyph) exglyph = $("<span/>").addClass("exglyph");
  if(!!url) {
    var url_;
    if(url instanceof Array) {
      url_ = url[0];
    } else {
      url_ = url;
    }
    var img = new Image();
    $(img)
      .load(function(){
        exglyph.css("background-image", "url('"+ url_ +"')").css("color", "transparent");
        img = null;
      })
      .error(function(){
        if(url instanceof Array && url.length > 1) {
          ExGlyph(url.slice(1), exglyph);
          img = null;
        } else {
          img = null;
        }
      })
      .attr("src", url_);
  }
  return exglyph;
}

function ParseQuery(val){
  val = charWidthRegulation(val);
  var qs = val.replace("\u3000", " ").split(" ");
  var query = [];
  for(var i = 0; i < qs.length; i++){
    var q = qs[i].toUpperCase();
    if(q === "") continue;
    if(IsKana(q)){
      query.push(["Read", q]);
      continue;
    }
    if(q == "NOUCS") {
      query.push(["NOUCS"]);
      continue;
    }
    if(q.substring(0,2) == "MJ") {
      q.match(/^MJ(\d+)(-(\d+))?$/);
      if(RegExp.$1) {
        if(RegExp.$3) {
          var mj1 = zeronum(parseInt(RegExp.$1, 10), 6);
          var l = 6-(RegExp.$3).length;
          var mj2 = parseInt(mj1.substring(0,l) + RegExp.$3, 10);
          query.push(["MJ", parseInt(RegExp.$1, 10), mj2]);
        } else {
          query.push(["MJ", "MJ" + zeronum(parseInt(RegExp.$1, 10), 6)]);
        }
      }
      continue;
    }
    var q0 = q.charAt(0);
    if('\u2F00' <= q0 && q0 < '\u2FD6') {
      q.match(/^.(\[(\d+)\])?(-?(\d+)?-?(\d+)?)$/);
      var radical = q0.charCodeAt(0) - 0x2F00 + 1;
      var radical2 = parseInt(RegExp.$2);
      var others = RegExp.$3 ? RegExp.$3 : "";
      if(radical2 && (radical !== radical2)) {
        continue;
      }
      q = "[" + radical + "]" + others;
      q0 = '[';
    }
    switch(q0) {
      case '[':
        q.match(/^\[(\d+)\]-?(\d+)?-?(\d+)?$/);
        var radical = RegExp.$1;
        var minstroke = RegExp.$2;
        var maxstroke = RegExp.$3;
        if(radical) {
          var indxq = ["Indx", radical];
          if(minstroke) {
            indxq.push(minstroke);
            if(maxstroke) indxq.push(maxstroke);
          }
          query.push(indxq);
        }
        continue;
      case '<': case '=': case '>':
        q.match(/^((=|<|>|<=|>=)(\d+)|=(\d+)-(\d+))$/);
        if(RegExp.$2) {
          query.push(["Strk", RegExp.$2 + RegExp.$3]);
        } else if(RegExp.$4) {
          query.push(["Strk", parseInt(RegExp.$4, 10), parseInt(RegExp.$5, 10)]);
        }
        continue;
      case '#':
        qs[i].match(/^#(\w+)$/);
        if(RegExp.$1) {
          query.push(["HS", RegExp.$1]);
        }
        continue;
      case 'U':
        q.match(/^U\+?([0-9A-F]{4,5})(-([0-9A-F]+))?$/);
        if (RegExp.$2) {
          var ucs = parseInt(RegExp.$1, 16);
          var l = (RegExp.$3).length * 4;
          var ucs2 = ((ucs >> l) << l) + parseInt(RegExp.$3, 16);
          query.push(["UCS", ucs, ucs2]);
        }else if(RegExp.$1) {
          var ucs = parseInt(RegExp.$1, 16);
          query.push(["UCS", ucs]);
        }
        continue;
    }
    if(q0.charCodeAt(0) >= 0xD840) query.push(["Str", q.substring(0,2)]);
    else if(q0.charCodeAt(0) >= 0x3400) query.push(["Str", q0]);
  }
  return query;
}

function XPathQuery(arr, nodes){
  if(!nodes) nodes = "/ci:CharInfoSet/ci:CharInfo/ci:Character";
  var str = "";
  for(var i = 0; i < arr.length; i++){
    switch(arr[i][0]) {
      case "MJ":
        if(arr[i][2]) {
          str += "[number(substring(ci:MJGlyphName/text(),3))>=" + arr[i][1]
               + " and number(substring(ci:MJGlyphName/text(),3))<=" + arr[i][2] + "]";
        } else {
          str += "[ci:MJGlyphName/text()=\"" + arr[i][1] + "\"]";
        }
        break;
      case "Strk":
        if(arr[i][2]) {
          str += "[ci:Strokes/text()>=" + arr[i][1]
               + " and ci:Strokes/text()<=" + arr[i][2] + "]";
        } else {
          str += "[ci:Strokes/text()" + arr[i][1] + "]";
        }
        break;
      case "Indx":
        if(arr[i][3]) {
          str += "[ci:Indices/ci:Index[@ci:radical=" + arr[i][1]
               + " and @ci:strokes>=" + arr[i][2]
               + " and @ci:strokes<=" + arr[i][3] + "]]";
        } else if(arr[i][2]) {
          str += "[ci:Indices/ci:Index[@ci:radical=" + arr[i][1] + " and @ci:strokes=" + arr[i][2] + "]]";
        } else {
          str += "[ci:Indices/ci:Index/@ci:radical=" + arr[i][1] + "]";
        }
        break;
      case "Read":
        str += "[ci:Readings/ci:Reading/text()=\"" + arr[i][1] + "\"]";
        break;
      case "UCS":
        if(arr[i][2]) str += "[ci:UCS/@ci:ucs>=" + arr[i][1]
                           + " and ci:UCS/@ci:ucs<=" + arr[i][2] + "]";
        else str += "[ci:UCS/@ci:ucs=" + arr[i][1] + "]";
        break;
      case "NOUCS":
        str += "[not(ci:UCS)]";
        break;
      case "HS":
        str += "[contains(ci:HeiseiMincho/text(), \"" + arr[i][1] + "\")]";
        break;
      case "Str":
        str += "[contains(ci:UCS/text(), \"" + arr[i][1]
             + "\") or contains(ci:IVS/text(), \"" + arr[i][1] + "\")]";
        break;
    }
  }
  return nodes + str;
}

var CharInfoNS = 'urn:uuid:c3a9c250-111d-11e1-b2ae-5f5c502ee262';
function nsResolver(prefix) {
  var ns = {
    'ci': CharInfoNS,
  };
  return ns[prefix] || null;
}

function getMJGlyph(chr) {
  var mj_font_installed = $.fontAvailable("MJMincho");
  var ivs_supported = IsIVSSupported();
  var mj = chr.getElementsByTagNameNS(CharInfoNS, "MJGlyphName")[0].firstChild.nodeValue;
  var ucs = chr.getElementsByTagNameNS(CharInfoNS, "UCS");
  var ivs = chr.getElementsByTagNameNS(CharInfoNS, "IVS");
  var img = ExGlyph().addClass("exglyph_mj").attr("title", mj);
  if(ivs[0]){
    if(!mj_font_installed || !ivs_supported) ExGlyph(MJURIList(mj), img);
    img.text(ivs[0].firstChild.nodeValue).addClass("exglyph_mj_ivs");
  } else if(ucs[0]){
    if(ucs[0].getAttributeNS(CharInfoNS, "imp") == "0"){
      ExGlyph(MJURIList(mj), img).addClass("exglyph_mj_ucs_not_imp");
    } else if(!mj_font_installed) {
      ExGlyph(MJURIList(mj), img);
    }
    img.text(ucs[0].firstChild.nodeValue);
  } else {
    ExGlyph(MJURIList(mj), img).addClass("exglyph_mj_no_ucs").text("\uFFFD");
  }
  return img;
}

function showMJInfo(xml, glyph, output) {
  if(!output) output = $("<div/>");
  var mj = glyph.attr("title");
  var xpath = XPathQuery([["MJ", mj]]);
  var chr = xml.evaluate(xpath, xml, nsResolver, XPathResult.ANY_TYPE, null).iterateNext();
  $("<div/>").append(glyph.clone()).attr("id", "detail_glyph").appendTo(output);
  var urllist = $("<ul class='links'/>");
  $("<li/>").append($("<a target='_blank'>PNG</a>").attr("href", MJImageURI(mj))).appendTo(urllist);
  $("<li/>").append($("<a target='_blank'>SVG</a>").attr("href", MJSVGURI(mj))).appendTo(urllist);
  urllist.appendTo(output);
  var info = $(chr).clone();
  var indices = xml.evaluate(xpath+"//ci:Index", xml, nsResolver, XPathResult.ANY_TYPE, null);
  var index;
  while(index = indices.iterateNext()) {
    var radical = parseInt(index.getAttributeNS(CharInfoNS, "radical"),10);
    var strokes = parseInt(index.getAttributeNS(CharInfoNS, "strokes"),10);
    var txt = KangXiRadical(radical) + "[" + radical + "]-" + strokes;
    $("<div/>").addClass("kangxi_index").text(txt).appendTo(output);
  }
  info.appendTo(output);
  return output;
}

function showGlyphs(result, output, bind, stop) {
  if(!output) output = $("<div/>");
  var MAX = 50;
  var itr;
  var i = 0;
  while((i<MAX) && (itr = result.iterateNext())) {
    var img = getMJGlyph(itr);
    if(!!bind) img.bind(bind);
    output.append(img);
    i++;
  }
  if(i == MAX) {
    output.showGlyphsTimerID = setTimeout(function(){showGlyphs(result, output, bind, stop);}, 10);
  } else {
    output.showGlyphsTimerID = null;
    if(typeof(stop) === 'function') stop();
  }
  return output;
}

$(document).ready(function(){
  var _ = function(locale){
    var __ = {
      'ja': {
        "Search": "検索",
        "Stop": "停止",
        "<p>now loading...</p>": "<p>読み込み中...</p>",
      },
    }
    return function(s) {
      var t = __[locale][s];
      return t ? t : s;
    };
  }($('html').attr('lang'));

  var input = $("#input");
  var output = $("#output");
  var detail = $("#detail");
  input.append(_("<p>now loading...</p>"));
  function mjview_init(xml){
    if( !$.fontAvailable("MJMincho") ) {
      $("#message").append(_("<p><a href='http://ossipedia.ipa.go.jp/ipamjfont/download.html'>IPAmj明朝</a>のインストールを推奨します。</p>"));
    }
    var inputbox = $("<input type='text'/>");
    var button = $("<input type='submit'/>").attr("value", _("Search"));
    var form = $("<form/>").append(inputbox).append(button).submit(function(){return false;});
    form.submit(function(){
      if(output.showGlyphsTimerID) {
        clearTimeout(output.showGlyphsTimerID);
        output.showGlyphsTimerID = null;
        button.attr("value", _("Search"));
        return;
      }
      var val = inputbox.val();
      var query = ParseQuery(val);
      if(query.length > 0) {
        var xpath = XPathQuery(query);
        if(!xml.evaluate) {
          output.empty().append("<p>error: xml evaluate not found</p>");
          return;
        }
        var result = xml.evaluate(xpath, xml, nsResolver, XPathResult.ANY_TYPE, null);
        if(result) {
          output.empty();
          button.attr("value", _("Stop"));
          showGlyphs(result, output, {
            "click": function(){
              detail.empty().append(showMJInfo(xml, $(this)));
            },
          }, function() {button.attr("value", _("Search"));});
        }
      }
    });
    input.empty().append(form);
  }
  var xmldocs = [];
  var xmlcount = 0;
  var num_xmls = 12;
  load_mjcharinfo = (function(i) {
    if (! (i < num_xmls)) return;
    $.ajax("data/mjcharinfo."+(i+1)+".xml").done(function(xmldoc){
      xmldocs[i] = xmldoc;
      xmlcount++;
      if(xmlcount < num_xmls) return;
      $.ajax("data/mjcharinfo.xml").done(function(xmlsetdoc){
        for(var i = 0; i < num_xmls; i++) {
          var node = xmlsetdoc.adoptNode(xmldocs[i].documentElement);
          xmlsetdoc.documentElement.appendChild(node);
        }
        mjview_init(xmlsetdoc);
      });
    });
    return load_mjcharinfo(i+1);
  });
  load_mjcharinfo(0);
});

