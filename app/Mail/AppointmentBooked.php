<?php

namespace App\Mail;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * The confirmation email sent to a patient after they book an appointment.
 *
 * By default MAIL_MAILER=log, so this "email" is written to
 * storage/logs/laravel.log — no real mail server needed for development.
 * Set real SMTP details in .env to actually deliver it.
 */
class AppointmentBooked extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * The booked appointment. Marking it "public" makes it available
     * inside the email's Blade view as $appointment.
     */
    public function __construct(public Appointment $appointment)
    {
    }

    /**
     * The email subject line.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your appointment is booked',
        );
    }

    /**
     * Which Blade view renders the email body.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.appointment-booked',
        );
    }
}
