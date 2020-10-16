#!/bin/bash
yum update -y
amazon-linux-extras install -y lamp-mariadb10.2-php7.2 php7.2
yum install -y httpd mariadb-server
systemctl start httpd
systemctl enable httpd
usermod -a -G apache ec2-user
chown -R ec2-user:apache /var/www
chmod 2775 /var/www
find /var/www -type d -exec chmod 2775 {} \;
find /var/www -type f -exec chmod 0664 {} \;
echo "<?php phpinfo(); ?>" > /var/www/html/phpinfo.php
sudo apt install nodejs
#!
aws s3 cp s3://artsiom-rybakou-task1/index.html /var/www/html/aws-hello.html
aws s3 cp s3://artsiom-rybakou-task3 /var/www/html/csv/ --recursive
bash /var/www/html/csv/script.sh
service httpd start
chkconfig httpd on



cd Documents/Projects/AWS\ training/creds/
cd /var/www/html/
cat /var/log/cloud-init-output.log
cat /var/www/html/aws-hello.html
cat /var/www/html/csv/output.csv
http://ec2-18-157-161-53.eu-central-1.compute.amazonaws.com/aws-hello.html


http://module5-80031505.eu-central-1.elb.amazonaws.com/aws-hello.html