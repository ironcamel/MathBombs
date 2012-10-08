use utf8;
package MathSheets::Schema::Result::User;

# Created by DBIx::Class::Schema::Loader
# DO NOT MODIFY THE FIRST PART OF THIS FILE

=head1 NAME

MathSheets::Schema::Result::User

=cut

use strict;
use warnings;

use base 'DBIx::Class::Core';

=head1 TABLE: C<user>

=cut

__PACKAGE__->table("user");

=head1 ACCESSORS

=head2 id

  data_type: 'varchar'
  is_nullable: 0
  size: 100

=head2 name

  data_type: 'text'
  is_nullable: 1

=head2 email

  data_type: 'text'
  is_nullable: 1

=head2 password

  data_type: 'text'
  is_nullable: 1

=head2 last_sheet

  data_type: 'int'
  default_value: 0
  is_nullable: 1

=cut

__PACKAGE__->add_columns(
  "id",
  { data_type => "varchar", is_nullable => 0, size => 100 },
  "name",
  { data_type => "text", is_nullable => 1 },
  "email",
  { data_type => "text", is_nullable => 1 },
  "password",
  { data_type => "text", is_nullable => 1 },
  "last_sheet",
  { data_type => "int", default_value => 0, is_nullable => 1 },
);

=head1 PRIMARY KEY

=over 4

=item * L</id>

=back

=cut

__PACKAGE__->set_primary_key("id");

=head1 RELATIONS

=head2 sheets

Type: has_many

Related object: L<MathSheets::Schema::Result::Sheet>

=cut

__PACKAGE__->has_many(
  "sheets",
  "MathSheets::Schema::Result::Sheet",
  { "foreign.user_id" => "self.id" },
  { cascade_copy => 1, cascade_delete => 1 },
);


# Created by DBIx::Class::Schema::Loader v0.07033 @ 2012-10-07 08:40:06
# DO NOT MODIFY THIS OR ANYTHING ABOVE! md5sum:78Nf2zWRCLA3Cgbs5ZRkcw


# You can replace this text with custom code or comments, and it will be preserved on regeneration
1;
