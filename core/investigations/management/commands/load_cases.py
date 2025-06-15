from django.core.management.base import BaseCommand
from django.db import connections
from users.models import Case as UserCase

from services.case_loader.case_loader import load_all_cases


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
            self.reset_sequences(['users_case', 'users_userprogress', 'users_availabletable'])
            
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
    
    def reset_sequences(self, table_names):
        with connections['users'].cursor() as cursor:
            for table in table_names:
                seq_name = f"{table}_id_seq"
                cursor.execute(f"ALTER SEQUENCE {seq_name} RESTART WITH 1;")
