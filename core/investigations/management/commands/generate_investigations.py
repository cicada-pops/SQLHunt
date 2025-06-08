from django.core.management.base import BaseCommand

from services.generator.data_generator import InvestigationsDataGenerator


class Command(BaseCommand):
    help = "Генерирует учебные данные для базы investigations"

    def add_arguments(self, parser):
        parser.add_argument('--persons', type=int, default=1500, help='Количество персон')
        parser.add_argument('--suspects', type=int, default=500, help='Количество подозреваемых')
        parser.add_argument('--charges', type=int, default=100, help='Количество обвинений')
        parser.add_argument('--statements', type=int, default=100, help='Количество показаний')
        parser.add_argument('--clear', action='store_true', help='Очистить все данные и выйти')

    def handle(self, *args, **options):
        generator = InvestigationsDataGenerator()

        if options['clear']:
            self.stdout.write(self.style.WARNING("Очищаем данные investigations..."))
            generator.clear_all_data()
            self.stdout.write(self.style.SUCCESS("Данные успешно очищены."))
            return

        self.stdout.write(self.style.WARNING("Генерация новых данных (с предварительной очисткой)..."))
        generator.run(
            persons=options['persons'],
            suspects=options['suspects'],
            charges=options['charges'],
            statements=options['statements']
        )
        self.stdout.write(self.style.SUCCESS("Генерация завершена успешно."))
