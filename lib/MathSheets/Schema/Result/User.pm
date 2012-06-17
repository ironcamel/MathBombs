package MathSheets::Schema::Result::User;

# Created by DBIx::Class::Schema::Loader
# DO NOT MODIFY THE FIRST PART OF THIS FILE

use strict;
use warnings;

use base 'DBIx::Class::Core';


=head1 NAME

MathSheets::Schema::Result::User

=cut

__PACKAGE__->table("user");

=head1 ACCESSORS

=head2 id

  data_type: 'text'
  is_nullable: 0

=head2 name

  data_type: 'text'
  is_nullable: 1

=cut

__PACKAGE__->add_columns(
  "id",
  { data_type => "text", is_nullable => 0 },
  "name",
  { data_type => "text", is_nullable => 1 },
);
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

=head2 problems

Type: has_many

Related object: L<MathSheets::Schema::Result::Problem>

=cut

__PACKAGE__->has_many(
  "problems",
  "MathSheets::Schema::Result::Problem",
  { "foreign.user_id" => "self.id" },
  { cascade_copy => 1, cascade_delete => 1 },
);


# Created by DBIx::Class::Schema::Loader v0.07010 @ 2012-06-17 05:05:22
# DO NOT MODIFY THIS OR ANYTHING ABOVE! md5sum:tbZCiazkDq55DuPksjvGVw


# You can replace this text with custom code or comments, and it will be preserved on regeneration
1;
