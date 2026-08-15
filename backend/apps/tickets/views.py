from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import SupportTicket, TicketReply
from .serializers import SupportTicketSerializer, TicketReplySerializer
from apps.notifications.models import Notification


class SupportTicketViewSet(viewsets.ModelViewSet):
    serializer_class = SupportTicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['supporter', 'admin'] or user.is_staff or user.is_superuser:
            return SupportTicket.objects.all().order_by('-created_at')
        return SupportTicket.objects.filter(user=user).order_by('-created_at')

    def perform_create(self, serializer):
        ticket = serializer.save(user=self.request.user)
        # Auto notification to support/admin team
        from apps.users.models import User
        supporters = User.objects.filter(role__in=['supporter', 'admin'])
        for s in supporters:
            Notification.objects.create(
                recipient=s,
                title="Support Ticket Created",
                message=f"New ticket '{ticket.subject}' submitted by {self.request.user.display_name}.",
                link="/admin/dashboard",
                notification_type="support_ticket"
            )

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        ticket = self.get_object()
        message = request.data.get('message')
        if not message:
            return Response({'error': 'Message is required.'}, status=status.HTTP_400_BAD_REQUEST)

        reply_obj = TicketReply.objects.create(
            ticket=ticket,
            sender=request.user,
            message=message
        )

        # Update status
        if request.user.role in ['supporter', 'admin'] or request.user.is_staff:
            ticket.status = 'replied'
            # Notify user
            Notification.objects.create(
                recipient=ticket.user,
                title="Ticket Reply Received",
                message=f"A support agent replied to your ticket: '{ticket.subject}'.",
                link="/settings",
                notification_type="support_ticket"
            )
        else:
            ticket.status = 'open'

        ticket.save()
        return Response(TicketReplySerializer(reply_obj).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'])
    def close(self, request, pk=None):
        ticket = self.get_object()
        ticket.status = 'closed'
        ticket.save()
        return Response(SupportTicketSerializer(ticket).data)
