use utf8;
package MathSheets::Schema::Result::Teacher;

# Created by DBIx::Class::Schema::Loader
# DO NOT MODIFY THE FIRST PART OF THIS FILE

=head1 NAME

MathSheets::Schema::Result::Teacher

=cut

use strict;
use warnings;

use base 'DBIx::Class::Core';

=head1 TABLE: C<teacher>

=cut

__PACKAGE__->table("teacher");

=head1 ACCESSORS

=head2 id

  data_type: 'varchar'
  is_nullable: 0
  size: 100

=head2 name

  data_type: 'varchar'
  is_nullable: 0
  size: 100

=head2 email

  data_type: 'varchar'
  is_nullable: 0
  size: 100

=head2 pw_hash

  data_type: 'text'
  is_nullable: 1

=head2 rewards_email

  data_type: 'varchar'
  is_nullable: 1
  size: 200

=cut

__PACKAGE__->add_columns(
  "id",
  { data_type => "varchar", is_nullable => 0, size => 100 },
  "name",
  { data_type => "varchar", is_nullable => 0, size => 100 },
  "email",
  { data_type => "varchar", is_nullable => 0, size => 100 },
  "pw_hash",
  { data_type => "text", is_nullable => 1 },
  "rewards_email",
  { data_type => "varchar", is_nullable => 1, size => 200 },
);

=head1 PRIMARY KEY

=over 4

=item * L</id>

=back

=cut

__PACKAGE__->set_primary_key("id");

=head1 UNIQUE CONSTRAINTS

=head2 C<email_unique>

=over 4

=item * L</email>

=back

=cut

__PACKAGE__->add_unique_constraint("email_unique", ["email"]);

=head1 RELATIONS

=head2 students

Type: has_many

Related object: L<MathSheets::Schema::Result::Student>

=cut

__PACKAGE__->has_many(
  "students",
  "MathSheets::Schema::Result::Student",
  { "foreign.teacher_id" => "self.id" },
  { cascade_copy => 1, cascade_delete => 1 },
);


# Created by DBIx::Class::Schema::Loader v0.07033 @ 2012-12-11 01:25:37
# DO NOT MODIFY THIS OR ANYTHING ABOVE! md5sum:3cM5/PQ1DQ+YAhjOnbHXjQ


# You can replace this text with custom code or comments, and it will be preserved on regeneration
1;
