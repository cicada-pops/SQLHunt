from django.core.management.base import BaseCommand

from services.generator.data_generator import InvestigationsDataGenerator


class Command(BaseCommand):
    help = "Генерирует учебные данные для базы investigations"

    def add_arguments(self, parser):
        parser.add_argument('--persons', type=int, default=1500)
        parser.add_argument('--suspects', type=int, default=500)
        parser.add_argument('--charges', type=int, default=100)
        parser.add_argument('--statements', type=int, default=100)

    def handle(self, *args, **options):
        generator = InvestigationsDataGenerator()
        self.stdout.write(self.style.WARNING("Начинаем генерацию данных..."))
        generator.run(
            persons=options['persons'],
            suspects=options['suspects'],
            charges=options['charges'],
            statements=options['statements']
        )
        self.stdout.write(self.style.SUCCESS("Генерация завершена успешно."))
