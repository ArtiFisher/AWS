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

cat /var/log/cloud-init-output.log
cat /var/www/html/aws-hello.html