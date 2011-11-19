mjcharinfo.xml: MJMojiJouhouIchiranhyou00101.zip split_charinfo.pl
	unzip -p $< MJ*.csv | perl $(word 2, $^) > $@

MJMojiJouhouIchiranhyou00101.zip:
	wget -O $@ http://ossipedia.ipa.go.jp/ipamjfont/mjmojiichiran/MJMojiJouhouIchiranhyou00101.zip

