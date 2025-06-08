from django.core.management.base import BaseCommand
from users.models import Case as UserCase

from services.case_loader import load_all_cases


class Command(BaseCommand):
    help = "Загружает SQL-кейсы в базу"

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear', action='store_true',
            help='Удалить все кейсы'
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(self.style.WARNING("Очищаем все кейсы и связанные данные..."))
            UserCase.objects.all().delete()

            self.stdout.write(self.style.SUCCESS("Очистка завершена."))
            return

        loaded, skipped = 0, 0

        for case in load_all_cases():
            result = case().create()
            if result:
                loaded += 1 
            else:
                skipped += 1

        self.stdout.write(self.style.SUCCESS(f"Новых дел: {loaded}"))
        self.stdout.write(self.style.SUCCESS(f"Загружено ранее: {skipped}"))
