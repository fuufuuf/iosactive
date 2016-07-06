 #!/bin/sh
 lp_dir=/root/iosactive
 forever start -al $lp_dir/logs/app.log -e $lp_dir/logs/err.log $lp_dir/bin/www

