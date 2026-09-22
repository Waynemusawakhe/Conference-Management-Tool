<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * A basic test example using API testing.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        // Use API testing without full HTTP kernel initialization
        $response = $this->json('GET', '/');

        $response->assertStatus(200);
    }
}
