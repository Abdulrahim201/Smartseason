from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Profile


class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        if not User.objects.filter(username='superadmin').exists():
            u = User.objects.create_superuser(
                'superadmin', 'admin@admin.com', 'Admin1234!'
            )
            Profile.objects.get_or_create(user=u, defaults={'role': 'admin'})
            self.stdout.write('Superadmin created successfully')
        else:
            self.stdout.write('Superadmin already exists')
