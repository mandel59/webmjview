all: mjcharinfo.1.xml mjcharinfo.2.xml  mjcharinfo.3.xml  mjcharinfo.4.xml \
     mjcharinfo.5.xml mjcharinfo.6.xml  mjcharinfo.7.xml  mjcharinfo.8.xml \
     mjcharinfo.9.xml mjcharinfo.10.xml mjcharinfo.11.xml mjcharinfo.12.xml
mjcharinfo.cvs: MJMojiJouhouIchiranhyou00101.zip
	unzip -p $< MJ*.csv | tail -n +2 > $@
mjcharinfo.1.xml: mjcharinfo.cvs split_charinfo.pl
	tail -n +1 mjcharinfo.cvs \
	| head -n 5000 | perl $(word 2, $^) > $@
mjcharinfo.2.xml: mjcharinfo.cvs split_charinfo.pl
	tail -n +5001 mjcharinfo.cvs \
	| head -n 5000 | perl $(word 2, $^) > $@
mjcharinfo.3.xml: mjcharinfo.cvs split_charinfo.pl
	tail -n +10001 mjcharinfo.cvs \
	| head -n 5000 | perl $(word 2, $^) > $@
mjcharinfo.4.xml: mjcharinfo.cvs split_charinfo.pl
	tail -n +15001 mjcharinfo.cvs \
	| head -n 5000 | perl $(word 2, $^) > $@
mjcharinfo.5.xml: mjcharinfo.cvs split_charinfo.pl
	tail -n +20001 mjcharinfo.cvs \
	| head -n 5000 | perl $(word 2, $^) > $@
mjcharinfo.6.xml: mjcharinfo.cvs split_charinfo.pl
	tail -n +25001 mjcharinfo.cvs \
	| head -n 5000 | perl $(word 2, $^) > $@
mjcharinfo.7.xml: mjcharinfo.cvs split_charinfo.pl
	tail -n +30001 mjcharinfo.cvs \
	| head -n 5000 | perl $(word 2, $^) > $@
mjcharinfo.8.xml: mjcharinfo.cvs split_charinfo.pl
	tail -n +35001 mjcharinfo.cvs \
	| head -n 5000 | perl $(word 2, $^) > $@
mjcharinfo.9.xml: mjcharinfo.cvs split_charinfo.pl
	tail -n +40001 mjcharinfo.cvs \
	| head -n 5000 | perl $(word 2, $^) > $@
mjcharinfo.10.xml: mjcharinfo.cvs split_charinfo.pl
	tail -n +45001 mjcharinfo.cvs \
	| head -n 5000 | perl $(word 2, $^) > $@
mjcharinfo.11.xml: mjcharinfo.cvs split_charinfo.pl
	tail -n +50001 mjcharinfo.cvs \
	| head -n 5000 | perl $(word 2, $^) > $@
mjcharinfo.12.xml: mjcharinfo.cvs split_charinfo.pl
	tail -n +55001 mjcharinfo.cvs \
	| head -n 5000 | perl $(word 2, $^) > $@
MJMojiJouhouIchiranhyou00101.zip:
	wget -O $@ http://ossipedia.ipa.go.jp/ipamjfont/mjmojiichiran/MJMojiJouhouIchiranhyou00101.zip

