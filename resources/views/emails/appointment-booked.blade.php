{{-- Plain, simple HTML email. $appointment is passed in from the AppointmentBooked mailable. --}}
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Appointment Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; color: #222; line-height: 1.5;">

    <h2 style="color: #2b6cb0;">Appointment Confirmed ✅</h2>

    <p>Hi {{ $appointment->patient->name }},</p>

    <p>Your appointment has been booked successfully. Here are the details:</p>

    <table cellpadding="6" style="border-collapse: collapse;">
        <tr>
            <td><strong>Doctor</strong></td>
            <td>{{ $appointment->doctor->user->name ?? 'N/A' }}</td>
        </tr>
        <tr>
            <td><strong>Date</strong></td>
            {{-- appointment_date is cast to a Carbon date, so we can format it nicely. --}}
            <td>{{ $appointment->appointment_date->format('l, F j, Y') }}</td>
        </tr>
        <tr>
            <td><strong>Time</strong></td>
            {{-- substr(0,5) turns "09:00:00" into "09:00". --}}
            <td>{{ substr($appointment->start_time, 0, 5) }} – {{ substr($appointment->end_time, 0, 5) }}</td>
        </tr>
        <tr>
            <td><strong>Status</strong></td>
            <td>{{ ucfirst($appointment->status) }}</td>
        </tr>
        <tr>
            <td><strong>Video call channel</strong></td>
            <td>{{ $appointment->agora_channel_name }}</td>
        </tr>
    </table>

    <p style="margin-top: 20px;">Thank you for using our Telemedicine service.</p>

</body>
</html>
