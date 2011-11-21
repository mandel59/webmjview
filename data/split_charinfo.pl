#!/usr/bin/env perl
use strict;
use warnings;
use utf8;
use Encode;

my $shiftjis = find_encoding('Shift_JIS');
my $utf8 = find_encoding('UTF-8');

my $xml_header = << "XML_HEADER";
<?xml version="1.0" encoding="UTF-8"?>
<ci:CharInfo xmlns:ci="urn:uuid:c3a9c250-111d-11e1-b2ae-5f5c502ee262">
<rdf:RDF xmlns:cc="http://creativecommons.org/ns#"
         xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
         xmlns:dc="http://purl.org/dc/elements/1.1/"
         xmlns:dcq="http://purl.org/dc/terms/">
  <cc:Work rdf:about="http://mandel59.github.com/webmjview/data/mjcharinfo.xml">
    <dc:title>MJCharInfo</dc:title>
    <dc:creator>
      <cc:Agent><dc:title>Ryusei Yamaguchi</dc:title></cc:Agent>
    </dc:creator>
    <dc:date>2011-11-19</dc:date>
    <dc:rights>
      <cc:Agent><dc:title>Information-technology Promotion Agency, Japan.</dc:title></cc:Agent>
      <cc:Agent><dc:title>Ryusei Yamaguchi.</dc:title></cc:Agent>
    </dc:rights>
    <cc:license rdf:resource="http://creativecommons.org/licenses/by-sa/2.1/jp/"/>
  </cc:Work>
  <cc:License rdf:about="http://creativecommons.org/licenses/by-sa/2.1/jp/">
    <cc:permits rdf:resource="http://creativecommons.org/ns#Reproduction"/>
    <cc:permits rdf:resource="http://creativecommons.org/ns#Distribution"/>
    <cc:permits rdf:resource="http://creativecommons.org/ns#DerivativeWorks"/>
    <cc:jurisdiction rdf:resource="http://creativecommons.org/international/jp/"/>
    <dc:title xml:lang="ja">表示 - 継承</dc:title>
    <dc:title xml:lang="zh">署名-相同方式共享</dc:title>
    <dc:title xml:lang="en">Attribution-ShareAlike</dc:title>
    <dc:title xml:lang="ko">저작자표시-동일조건변경허락</dc:title>
    <dc:title xml:lang="zh-tw">姓名標示-相同方式分享</dc:title>
    <dcq:hasVersion>2.1</dcq:hasVersion>
    <cc:legalcode rdf:resource="http://creativecommons.org/licenses/by-sa/2.1/jp/legalcode"/>
    <dc:source rdf:resource="http://creativecommons.org/licenses/by-sa/2.1/"/>
    <dc:creator rdf:resource="http://creativecommons.org"/>
    <cc:requires rdf:resource="http://creativecommons.org/ns#ShareAlike"/>
    <cc:requires rdf:resource="http://creativecommons.org/ns#Attribution"/>
    <cc:requires rdf:resource="http://creativecommons.org/ns#Notice"/>
  </cc:License>
</rdf:RDF>
XML_HEADER

print $utf8->encode($xml_header);

while( <STDIN> ) {
    my @row = split(",",$shiftjis->decode($_));
    my $mj_glyph = $row[0];
    my $svg_version = $row[1];
    my $hanyodenshi = $row[2];
    my $heiseimincho = $row[3];
    my @index = ( [$row[4], $row[5]], [$row[6], $row[7]], [$row[8], $row[9]], [$row[10], $row[11]] );
    my $strokes = $row[12];
    my @readings = split("・", $row[13]);
    my $measure = $row[14];
    my ($koseki, $juki, $toki) = ($row[15], $row[16], $row[17]);
    my ($x0213, $x0213_subsumption, $x0213_class) = ($row[18], $row[19], $row[20]);
    my $x0212 = $row[21];
    my ($ucs, $ucs_class, $ucs_imp) = ($row[22], $row[23], $row[24]);
    my ($ivs_ucs, $ivs) = split("_", $row[25]);
    my $ivs_imp = $row[26];
    my $daikanwa = $row[27];
    my $history = $row[28];
    $history =~ s/[\r\n]//g;
    print $utf8->encode("<ci:Character>\n");
    print $utf8->encode("<ci:MJGlyphName>$mj_glyph</ci:MJGlyphName>\n");
    print $utf8->encode("<ci:SVGVersion>$svg_version</ci:SVGVersion>\n");
    print $utf8->encode("<ci:HanyoDenshi>$hanyodenshi</ci:HanyoDenshi>\n");
    print $utf8->encode("<ci:HeiseiMincho>$heiseimincho</ci:HeiseiMincho>\n");
    print $utf8->encode("<ci:Strokes>$strokes</ci:Strokes>\n");
    print $utf8->encode("<ci:History>$history</ci:History>\n") if $history;
    print $utf8->encode("<ci:Indices>\n");
    foreach my $i (@index) {
        print $utf8->encode("<ci:Index ci:radical=\"@{[$i->[0]]}\" ci:strokes=\"@{[$i->[1]]}\" />\n") if $i->[0];
    }
    print $utf8->encode("</ci:Indices>\n");
    print $utf8->encode("<ci:Readings>\n");
    foreach my $reading (@readings) {
        print $utf8->encode("<ci:Reading>$reading</ci:Reading>\n");
    }
    print $utf8->encode("</ci:Readings>\n");
    print $utf8->encode("<ci:Measure>$measure</ci:Measure>\n") if $measure;
    print $utf8->encode("<ci:Koseki>$koseki</ci:Koseki>\n") if $koseki;
    print $utf8->encode("<ci:Juki ci:juki=\"@{[hex(substr($juki, 2))]}\">$juki</ci:Juki>\n") if $juki;
    print $utf8->encode("<ci:Toki>$toki</ci:Toki>\n") if $toki;
    print $utf8->encode("<ci:X0213 ci:sub=\"$x0213_subsumption\" ci:x0213cls=\"$x0213_class\">$x0213</ci:X0213>\n") if $x0213;
    print $utf8->encode("<ci:X0212>$x0212</ci:X0212>\n") if $x0212;
    print $utf8->encode("<ci:UCS ci:ucs=\"@{[hex(substr($ucs, 2))]}\" ci:ucscls=\"$ucs_class\" ci:imp=\"@{[$ucs_imp?1:0]}\">&#x@{[substr($ucs, 2)]};</ci:UCS>\n") if $ucs;
    print $utf8->encode("<ci:IVS ci:ucs=\"@{[hex($ivs_ucs)]}\" ci:ivs=\"@{[hex($ivs)]}\" ci:imp=\"@{[$ivs_imp?1:0]}\">&#x$ivs_ucs;&#x$ivs;</ci:IVS>\n") if $ivs;
    print $utf8->encode("<ci:Daikanwa>$daikanwa</ci:Daikanwa>\n") if $daikanwa;
    print "</ci:Character>\n"
}
print "</ci:CharInfo>\n";

