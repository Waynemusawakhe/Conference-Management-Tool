<?php

namespace App\Modules\Shared\Enums;

enum UserRole: string
{
    case Author = 'author';
    case Reviewer = 'reviewer';
    case Organiser = 'organiser';
    case Attendee = 'attendee';
    case Admin = 'admin';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}