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
    if($.browser.msie && parseInt($.browser.version.match(/\d+/)) > 9 )
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
    var q = qs[i].toUpperCase();
    if(q === "") continue;
    if(IsKana(q)){
      query.push(["Read", q]);
      continue;
    }
    if(q.substring(0,2) == "MJ") {
      query.push(["MJ", "MJ" + zeronum(parseInt(q.substring(2), 10), 6)]);
      continue;
    }
    var q0 = q.charAt(0);
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
        var v = q.substring(1).split("-");
        if(v.length == 2) {
          query.push(["Strk", parseInt(v[0]), parseInt(v[1])]);
        } else query.push(["Strk", q]);
        continue;
      case 'U':
        q.match(/^U\+?([0-9A-F]{4,5})$/);
        if(RegExp.$1) {
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
  if(!nodes) nodes = "/ci:CharInfo/ci:Character";
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
          str += "[ci:Indices/ci:Index[@ci:radical=" + arr[i][1] + " and @ci:strokes=" + arr[i][2] + "]]";
        } else {
          str += "[ci:Indices/ci:Index/@ci:radical=" + arr[i][1] + "]";
        }
        break;
      case "Read":
        str += "[ci:Readings/ci:Reading/text()=\"" + arr[i][1] + "\"]";
        break;
      case "UCS":
        str += "[ci:UCS/@ci:ucs=" + arr[i][1] + "]";
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
  var infolist = $("<dl/>");
  var info = $(chr).clone();
  var indices = xml.evaluate(xpath+"//ci:Index", xml, nsResolver, XPathResult.ANY_TYPE, null);
  var index;
  while(index = indices.iterateNext()) {
    var radical = parseInt(index.getAttributeNS(CharInfoNS, "radical"));
    var strokes = parseInt(index.getAttributeNS(CharInfoNS, "strokes"));
    var txt = KangXiRadical(radical) + "[" + radical + "]-" + strokes;
    $("<div/>").addClass("kangxi_index").text(txt).appendTo(output);
  }
  info.appendTo(output);
  return output;
}

function showGlyphs(result, output, bind) {
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
    var button = $("<input type='submit' value='Search'/>");
    var form = $("<form/>").append(inputbox).append(button).submit(function(){return false;});
    form.submit(function(){
      if(output.showGlyphsTimerID) {
        clearTimeout(output.showGlyphsTimerID);
        output.showGlyphsTimerID = null;
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
          showGlyphs(result, output, {
            "click": function(){
              detail.empty().append(showMJInfo(xml, $(this)));
            },
          });
        }
      }
    });
    input.empty().append(form);
  });
});

