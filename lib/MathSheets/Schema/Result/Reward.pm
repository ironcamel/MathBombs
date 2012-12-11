use utf8;
package MathSheets::Schema::Result::Reward;

# Created by DBIx::Class::Schema::Loader
# DO NOT MODIFY THE FIRST PART OF THIS FILE

=head1 NAME

MathSheets::Schema::Result::Reward

=cut

use strict;
use warnings;

use base 'DBIx::Class::Core';

=head1 TABLE: C<reward>

=cut

__PACKAGE__->table("reward");

=head1 ACCESSORS

=head2 student_id

  data_type: 'varchar'
  is_foreign_key: 1
  is_nullable: 0
  size: 100

=head2 sheet_id

  data_type: 'int'
  is_nullable: 0

=head2 reward

  data_type: 'text'
  is_nullable: 0

=cut

__PACKAGE__->add_columns(
  "student_id",
  { data_type => "varchar", is_foreign_key => 1, is_nullable => 0, size => 100 },
  "sheet_id",
  { data_type => "int", is_nullable => 0 },
  "reward",
  { data_type => "text", is_nullable => 0 },
);

=head1 PRIMARY KEY

=over 4

=item * L</student_id>

=item * L</sheet_id>

=back

=cut

__PACKAGE__->set_primary_key("student_id", "sheet_id");

=head1 RELATIONS

=head2 student

Type: belongs_to

Related object: L<MathSheets::Schema::Result::Student>

=cut

__PACKAGE__->belongs_to(
  "student",
  "MathSheets::Schema::Result::Student",
  { id => "student_id" },
  { is_deferrable => 0, on_delete => "CASCADE", on_update => "CASCADE" },
);


# Created by DBIx::Class::Schema::Loader v0.07033 @ 2012-12-11 03:14:27
# DO NOT MODIFY THIS OR ANYTHING ABOVE! md5sum:CLB/Z98n782imaIM+3IF9w


# You can replace this text with custom code or comments, and it will be preserved on regeneration
1;
