use utf8;
package MathSheets::Schema::Result::Powerup;

# Created by DBIx::Class::Schema::Loader
# DO NOT MODIFY THE FIRST PART OF THIS FILE

=head1 NAME

MathSheets::Schema::Result::Powerup

=cut

use strict;
use warnings;

use base 'DBIx::Class::Core';

=head1 TABLE: C<powerup>

=cut

__PACKAGE__->table("powerup");

=head1 ACCESSORS

=head2 id

  data_type: 'int'
  is_nullable: 0

=head2 name

  data_type: 'varchar'
  is_nullable: 0
  size: 100

=head2 filepath

  data_type: 'varchar'
  is_nullable: 0
  size: 1000

=cut

__PACKAGE__->add_columns(
  "id",
  { data_type => "int", is_nullable => 0 },
  "name",
  { data_type => "varchar", is_nullable => 0, size => 100 },
  "filepath",
  { data_type => "varchar", is_nullable => 0, size => 1000 },
);

=head1 PRIMARY KEY

=over 4

=item * L</id>

=back

=cut

__PACKAGE__->set_primary_key("id");

=head1 RELATIONS

=head2 user_powerups

Type: has_many

Related object: L<MathSheets::Schema::Result::UserPowerup>

=cut

__PACKAGE__->has_many(
  "user_powerups",
  "MathSheets::Schema::Result::UserPowerup",
  { "foreign.powerup_id" => "self.id" },
  { cascade_copy => 1, cascade_delete => 1 },
);


# Created by DBIx::Class::Schema::Loader v0.07033 @ 2012-10-29 01:44:39
# DO NOT MODIFY THIS OR ANYTHING ABOVE! md5sum:e6fcNNvrVytJQjeWT/MTGw


# You can replace this text with custom code or comments, and it will be preserved on regeneration
1;
