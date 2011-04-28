package MathSheets::Schema::Result::Sheet;

# Created by DBIx::Class::Schema::Loader
# DO NOT MODIFY THE FIRST PART OF THIS FILE

use strict;
use warnings;

use base 'DBIx::Class::Core';


=head1 NAME

MathSheets::Schema::Result::Sheet

=cut

__PACKAGE__->table("sheet");

=head1 ACCESSORS

=head2 id

  data_type: 'int'
  is_nullable: 0

=head2 user_id

  data_type: 'text'
  is_foreign_key: 1
  is_nullable: 0

=cut

__PACKAGE__->add_columns(
  "id",
  { data_type => "int", is_nullable => 0 },
  "user_id",
  { data_type => "text", is_foreign_key => 1, is_nullable => 0 },
);
__PACKAGE__->set_primary_key("id", "user_id");

=head1 RELATIONS

=head2 user

Type: belongs_to

Related object: L<MathSheets::Schema::Result::User>

=cut

__PACKAGE__->belongs_to(
  "user",
  "MathSheets::Schema::Result::User",
  { id => "user_id" },
  { is_deferrable => 1, on_delete => "CASCADE", on_update => "CASCADE" },
);

=head2 problems

Type: has_many

Related object: L<MathSheets::Schema::Result::Problem>

=cut

__PACKAGE__->has_many(
  "problems",
  "MathSheets::Schema::Result::Problem",
  { "foreign.sheet_id" => "self.id" },
  { cascade_copy => 0, cascade_delete => 0 },
);


# Created by DBIx::Class::Schema::Loader v0.07010 @ 2011-04-28 01:05:40
# DO NOT MODIFY THIS OR ANYTHING ABOVE! md5sum:SG+2exPAV7ruUUtOyHhMeA


# You can replace this text with custom code or comments, and it will be preserved on regeneration
1;
