use utf8;
package MathSheets::Schema::Result::PasswordResetToken;

# Created by DBIx::Class::Schema::Loader
# DO NOT MODIFY THE FIRST PART OF THIS FILE

=head1 NAME

MathSheets::Schema::Result::PasswordResetToken

=cut

use strict;
use warnings;

use base 'DBIx::Class::Core';

=head1 TABLE: C<password_reset_tokens>

=cut

__PACKAGE__->table("password_reset_tokens");

=head1 ACCESSORS

=head2 id

  data_type: 'varchar'
  is_nullable: 0
  size: 100

=head2 teacher_id

  data_type: 'varchar'
  is_foreign_key: 1
  is_nullable: 0
  size: 100

=head2 is_deleted

  data_type: 'int'
  default_value: 0
  is_nullable: 0

=head2 created

  data_type: 'date'
  is_nullable: 0

=head2 updated

  data_type: 'date'
  is_nullable: 0

=cut

__PACKAGE__->add_columns(
  "id",
  { data_type => "varchar", is_nullable => 0, size => 100 },
  "teacher_id",
  { data_type => "varchar", is_foreign_key => 1, is_nullable => 0, size => 100 },
  "is_deleted",
  { data_type => "int", default_value => 0, is_nullable => 0 },
  "created",
  { data_type => "date", is_nullable => 0 },
  "updated",
  { data_type => "date", is_nullable => 0 },
);

=head1 PRIMARY KEY

=over 4

=item * L</id>

=back

=cut

__PACKAGE__->set_primary_key("id");

=head1 RELATIONS

=head2 teacher

Type: belongs_to

Related object: L<MathSheets::Schema::Result::Teacher>

=cut

__PACKAGE__->belongs_to(
  "teacher",
  "MathSheets::Schema::Result::Teacher",
  { id => "teacher_id" },
  { is_deferrable => 0, on_delete => "CASCADE", on_update => "CASCADE" },
);


# Created by DBIx::Class::Schema::Loader v0.07049 @ 2020-07-22 18:07:51
# DO NOT MODIFY THIS OR ANYTHING ABOVE! md5sum:Wu/ANanzTCGVBdwewYOTIA

# You can replace this text with custom code or comments, and it will be preserved on regeneration

__PACKAGE__->load_components(qw(TimeStamp));

__PACKAGE__->add_columns(
    '+created' => { data_type => 'datetime', set_on_create => 1 },
    '+updated' => {
        data_type => 'datetime',
        set_on_create => 1,
        set_on_update => 1,
    },
);

1;
