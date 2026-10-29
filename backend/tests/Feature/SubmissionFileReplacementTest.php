<?php

namespace Tests\Feature\Submissions;

use App\Models\User;
use App\Modules\Conferences\Models\Conference;
use App\Modules\Submissions\Actions\UpdateSubmissionAction;
use App\Modules\Submissions\Models\Submission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Tests\TestCase;

class SubmissionFileReplacementTest extends TestCase
{
    use RefreshDatabase;

    public function test_replacing_submission_file_deletes_old_file_only_after_success(): void
    {
        Storage::fake('private');

        $author = User::factory()->create([
            'role' => 'author',
        ]);

        $conference = Conference::factory()->create();

        Storage::disk('private')->put(
            'submissions/original.pdf',
            'original content'
        );

        $submission = Submission::factory()
            ->for($author, 'author')
            ->for($conference, 'conference')
            ->create([
                'status' => 'pending',
                'file_path' => 'submissions/original.pdf',
                'file_size_bytes' => 16,
            ]);

        $replacement = UploadedFile::fake()
            ->create(
                'replacement.pdf',
                25,
                'application/pdf'
            );

        $updated = app(
            UpdateSubmissionAction::class
        )->execute(
            $submission,
            [
                'title' => 'Updated submission',
            ],
            $replacement
        );

        $this->assertSame(
            'Updated submission',
            $updated->title
        );

        $this->assertNotSame(
            'submissions/original.pdf',
            $updated->file_path
        );

        Storage::disk('private')
            ->assertMissing(
                'submissions/original.pdf'
            );

        Storage::disk('private')
            ->assertExists(
                $updated->file_path
            );

        $this->assertDatabaseHas(
            'submissions',
            [
                'id' => $submission->id,
                'title' => 'Updated submission',
                'file_path' => $updated->file_path,
            ]
        );
    }

    public function test_failed_replacement_keeps_existing_submission_file_and_database_path(): void
    {
        Storage::fake('private');

        $author = User::factory()->create([
            'role' => 'author',
        ]);

        $conference = Conference::factory()->create();

        Storage::disk('private')->put(
            'submissions/original.pdf',
            'original content'
        );

        $submission = Submission::factory()
            ->for($author, 'author')
            ->for($conference, 'conference')
            ->create([
                'status' => 'pending',
                'file_path' => 'submissions/original.pdf',
                'file_size_bytes' => 16,
            ]);

        $replacement = $this->createMock(
            UploadedFile::class
        );

        $replacement
            ->method('store')
            ->willThrowException(
                new RuntimeException(
                    'Simulated storage failure.'
                )
            );

        try {
            app(
                UpdateSubmissionAction::class
            )->execute(
                $submission,
                [
                    'title' => 'Should not be saved',
                ],
                $replacement
            );

            $this->fail(
                'Expected the simulated storage failure.'
            );
        } catch (RuntimeException $exception) {
            $this->assertSame(
                'Simulated storage failure.',
                $exception->getMessage()
            );
        }

        Storage::disk('private')
            ->assertExists(
                'submissions/original.pdf'
            );

        $submission->refresh();

        $this->assertSame(
            'submissions/original.pdf',
            $submission->file_path
        );

        $this->assertNotSame(
            'Should not be saved',
            $submission->title
        );
    }
}
