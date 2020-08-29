package MathSheets::Routes;
use Dancer ':syntax';

any qr{(.+)} => sub { template 'app' };

1;
