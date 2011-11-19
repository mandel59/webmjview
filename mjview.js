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

function IsMJFontInstalled() {
  return true;
}
function IsIVSSupported() {
  if($.browser) {
    if($.browser.mozilla && parseFloat($.browser.version.match(/[0-9]+(\.[0-9]+)?/)) > 3.9 )
      return true;
    if($.browser.opera && navigator.userAgent.indexOf("Win") != -1)
      return true;
    if($.browser.msie && parseInt($.browser.version.match(/[0-9]+/)) > 9 )
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
  var qs = val.replace("\u3000", " ").split(" ");
  var query = [];
  for(var i = 0; i < qs.length; i++){
    var q = qs[i];
    if(IsKana(q)){
      query.push(["Read", q]);
      continue;
    }
    if(q.substring(0,2).toUpperCase() == "MJ") {
      query.push(["MJ", "MJ" + zeronum(parseInt(q.substring(2)), 6)]);
      continue;
    }
    switch(q.charAt(0)) {
      case '<':
      case '=':
      case '>':
        var v = q.substring(1).split("-");
        if(v.length > 1) {
          query.push(["Strk", v[0], v[1]]);
        } else query.push(["Strk", q]);
        continue;
    }
  }
  return query;
}

function XPathQuery(arr, nodes){
  if(!nodes) nodes = "//ci:CharInfo/ci:Character";
  var str = "";
  for(var i = 0; i < arr.length; i++){
    switch(arr[i][0]) {
      case "MJ":
        str += "[ci:MJGlyphName/text()=\"" + arr[i][1] + "\"]";
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
          str += "[ci:Indices/ci:Index[@ci:radical=" + arr[i][1] + " and @ci:strokes" + arr[i][2] + "]]";
        } else {
          str += "[ci:Indices/ci:Index/@ci:radical=" + arr[i][1] + "]";
        }
        break;
      case "Read":
        str += "[ci:Readings/ci:Reading/text()=\"" + arr[i][1] + "\"]";
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

function showGlyphs(result, output, bind) {
  var mj_font_installed = IsMJFontInstalled();
  var ivs_supported = IsIVSSupported();
  if(!output) output = $("<div/>");
  var MAX = 50;
  var itr;
  var i = 0;
  while((i<MAX) && (itr = result.iterateNext())) {
    var mj = itr.getElementsByTagNameNS(CharInfoNS, "MJGlyphName")[0].firstChild.nodeValue;
    var img = ExGlyph().addClass("exglyph_mj").attr("title", mj);
    var ucs = itr.getElementsByTagNameNS(CharInfoNS, "UCS");
    var ivs = itr.getElementsByTagNameNS(CharInfoNS, "IVS");
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
    if(!!bind) img.bind(bind);
    output.append(img);
    i++;
  }
  if(i == MAX) {
    output.showGlyphsTimerID = setTimeout(function(){showGlyphs(result, output, bind);}, 10);
  } else {
    output.showGlyphsTimerID = null;
  }
  return output;
}

$(document).ready(function(){
  var input = $("#input");
  var output = $("#output");
  var detail = $("#detail");
  var xhr = $.ajax("data/mjcharinfo.xml").done(function(xml){
    var inputbox = $("<input type='text'/>");
    var submit = "<input type='submit' value='Search'/>"
    var form = $("<form/>").append(inputbox).append(submit).submit(function(){
      if(output.showGlyphsTimerID) {
        clearTimeout(output.showGlyphsTimerID);
        output.showGlyphsTimerID = null;
        return false;
      }
      var val = inputbox.val();
      var query = ParseQuery(val);
      if(query.length > 0) {
        var xpath = XPathQuery(query);
        var result = xml.evaluate(xpath, xml, nsResolver, XPathResult.ANY_TYPE, null);
        output.empty();
        showGlyphs(result, output, {
          "click": function(){
            detail.empty().append($(this).clone());
          },
        });
      }
      return false;
    });
    input.append(form);
  });
});

