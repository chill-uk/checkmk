DISTRO_CODE     = sles11sp2
BUILD_PACKAGES  =
BUILD_PACKAGES += samba-client
BUILD_PACKAGES += boost-devel
BUILD_PACKAGES += samba-client # otherwise path to smblient missing in util.pm
BUILD_PACKAGES += freetype2-devel
BUILD_PACKAGES += gcc
BUILD_PACKAGES += gcc-c++
BUILD_PACKAGES += gd-devel
BUILD_PACKAGES += git
BUILD_PACKAGES += glib-devel
BUILD_PACKAGES += libcurl-devel   # needed by perl modules / thruk
BUILD_PACKAGES += libexpat-devel
BUILD_PACKAGES += libevent-devel
BUILD_PACKAGES += libgnutls-devel
BUILD_PACKAGES += libjpeg-devel
BUILD_PACKAGES += libmcrypt-devel
BUILD_PACKAGES += libmysqlclient-devel
BUILD_PACKAGES += postgresql-devel
BUILD_PACKAGES += libopenssl-devel
BUILD_PACKAGES += libpng-devel
BUILD_PACKAGES += libuuid-devel
BUILD_PACKAGES += libxml2-devel
BUILD_PACKAGES += sqlite3-devel # needed by Python (for sqlite3 module)
BUILD_PACKAGES   += tk-devel # needed by Python (for Tkinter module)
BUILD_PACKAGES += make
BUILD_PACKAGES += openldap2-devel
BUILD_PACKAGES += pango-devel
BUILD_PACKAGES   += pcre-devel # needed for compiling rrdtool
BUILD_PACKAGES += patch
BUILD_PACKAGES += readline-devel
BUILD_PACKAGES += apache2-devel
BUILD_PACKAGES += freeradius-client-devel
BUILD_PACKAGES += libtool # needed for mod-gearman
BUILD_PACKAGES += groff # needed for rrdtools
BUILD_PACKAGES += ruby # needed for rrdtools
BUILD_PACKAGES += tcl-devel
BUILD_PACKAGES += gettext-tools
BUILD_PACKAGES += gettext
BUILD_PACKAGES   += libbz2-devel # needed for msitools
BUILD_PACKAGES   += intltool # needed for building libgsf # needed for msitools
BUILD_PACKAGES += libpcap-devel # needed buy CMC
BUILD_PACKAGES += rrdtool-devel # needed for CMC
BUILD_PACKAGES += libffi-devel # needed for pyOpenSSL (and dependant) compilations
BUILD_PACKAGES += krb5-devel # needed for pykerberos / requests-kerberos python modules
BUILD_PACKAGES += flex # needed for heirloom-pkgtools
BUILD_PACKAGES   += openssh # needed for check_by_ssh
OS_PACKAGES     =
OS_PACKAGES    += cron # needed for sites cron jobs
OS_PACKAGES      += net-tools # traceroute is needed for Check_MK parent scan
OS_PACKAGES    += apache2
OS_PACKAGES    += bind-utils
OS_PACKAGES    += curl
OS_PACKAGES    += dialog
OS_PACKAGES    += gd
OS_PACKAGES    += graphviz
OS_PACKAGES    += libpng12-0
OS_PACKAGES    += libevent-1_4-2
OS_PACKAGES    += libltdl7
OS_PACKAGES    += libreadline5
OS_PACKAGES    += libuuid1
OS_PACKAGES    += pango
OS_PACKAGES    += php5-fastcgi
OS_PACKAGES    += php5-gd
OS_PACKAGES    += php5-iconv
OS_PACKAGES    += php5-mbstring
OS_PACKAGES    += php5-pear
OS_PACKAGES    += php5-sockets
OS_PACKAGES    += php5-sqlite
OS_PACKAGES    += php5-openssl
OS_PACKAGES    += rsync
OS_PACKAGES    += samba-client
OS_PACKAGES    += unzip
OS_PACKAGES    += xinetd
OS_PACKAGES    += xorg-x11-fonts
OS_PACKAGES    += freeradius-client-libs
OS_PACKAGES    += binutils # Needed by Check_MK Agent Bakery
OS_PACKAGES    += libgio-2_0-0 # needed by msitools/Agent Bakery
OS_PACKAGES    += cpio # needed for Agent bakery (solaris pkgs)
OS_PACKAGES    += poppler-tools # needed for preview of PDF in reporting
OS_PACKAGES    += libpcap0 # needed for ICMP of CMC
OS_PACKAGES     += libffi43 # needed for pyOpenSSL and dependant
USERADD_OPTIONS   = -M
ADD_USER_TO_GROUP = groupmod -A %(user)s %(group)s
PACKAGE_INSTALL   = zypper -n refresh ; zypper -n install
ACTIVATE_INITSCRIPT = chkconfig --add %s
APACHE_CONF_DIR   = /etc/apache2/conf.d
APACHE_INIT_NAME  = apache2
APACHE_USER       = wwwrun
APACHE_GROUP      = www
APACHE_BIN        = /usr/sbin/httpd2-prefork
APACHE_CTL        = /usr/sbin/apache2ctl
APACHE_MODULE_DIR = /usr/lib/apache2-prefork
APACHE_MODULE_DIR_64 = /usr/lib64/apache2-prefork
HTPASSWD_BIN      = /usr/bin/htpasswd2
PHP_FCGI_BIN	  = /usr/bin/php-cgi
APACHE_ENMOD      = a2enmod %s
BECOME_ROOT       = su -c
MOUNT_OPTIONS     =
INIT_CMD          = /etc/init.d/%(name)s %(action)s
