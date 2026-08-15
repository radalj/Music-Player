from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User
from .models import SupportTicket, TicketReply


class TicketTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='ticketuser', email='ticketuser@example.com', password='password123', display_name='Ticket User'
        )
        self.supporter = User.objects.create_user(
            username='support1', email='support1@example.com', password='password123', display_name='Support One', role='supporter'
        )

    def test_create_and_reply_ticket(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/tickets/tickets/', {'subject': 'Need Help', 'message': 'I have a question'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        ticket_id = response.data['id']
        self.client.force_authenticate(user=self.supporter)
        reply_res = self.client.post(f'/api/tickets/tickets/{ticket_id}/reply/', {'message': 'Here is your answer'})
        self.assertEqual(reply_res.status_code, status.HTTP_201_CREATED)

        ticket = SupportTicket.objects.get(id=ticket_id)
        self.assertEqual(ticket.status, 'replied')
