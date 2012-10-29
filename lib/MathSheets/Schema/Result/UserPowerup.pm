use utf8;
package MathSheets::Schema::Result::UserPowerup;

# Created by DBIx::Class::Schema::Loader
# DO NOT MODIFY THE FIRST PART OF THIS FILE

=head1 NAME

MathSheets::Schema::Result::UserPowerup

=cut

use strict;
use warnings;

use base 'DBIx::Class::Core';

=head1 TABLE: C<user_powerup>

=cut

__PACKAGE__->table("user_powerup");

=head1 ACCESSORS

=head2 user_id

  data_type: 'varchar'
  is_foreign_key: 1
  is_nullable: 0
  size: 100

=head2 powerup_id

  data_type: 'int'
  is_foreign_key: 1
  is_nullable: 0

=head2 count

  data_type: (empty string)
  default_value: 0
  is_nullable: 0

=cut

__PACKAGE__->add_columns(
  "user_id",
  { data_type => "varchar", is_foreign_key => 1, is_nullable => 0, size => 100 },
  "powerup_id",
  { data_type => "int", is_foreign_key => 1, is_nullable => 0 },
  "count",
  { data_type => "", default_value => 0, is_nullable => 0 },
);

=head1 PRIMARY KEY

=over 4

=item * L</user_id>

=item * L</powerup_id>

=back

=cut

__PACKAGE__->set_primary_key("user_id", "powerup_id");

=head1 RELATIONS

=head2 powerup

Type: belongs_to

Related object: L<MathSheets::Schema::Result::Powerup>

=cut

__PACKAGE__->belongs_to(
  "powerup",
  "MathSheets::Schema::Result::Powerup",
  { id => "powerup_id" },
  { is_deferrable => 0, on_delete => "CASCADE", on_update => "CASCADE" },
);

=head2 user

Type: belongs_to

Related object: L<MathSheets::Schema::Result::User>

=cut

__PACKAGE__->belongs_to(
  "user",
  "MathSheets::Schema::Result::User",
  { id => "user_id" },
  { is_deferrable => 0, on_delete => "CASCADE", on_update => "CASCADE" },
);


# Created by DBIx::Class::Schema::Loader v0.07033 @ 2012-10-29 01:57:05
# DO NOT MODIFY THIS OR ANYTHING ABOVE! md5sum:WWbaIZg9SHuLQApiMWeCEA


# You can replace this text with custom code or comments, and it will be preserved on regeneration
1;
