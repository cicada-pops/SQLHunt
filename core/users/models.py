from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models


class TimeStampedModel(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        
        
class User(TimeStampedModel):
    id = models.AutoField(primary_key=True)
    xp = models.IntegerField(default=0, validators=[MinValueValidator(0)])

    def __str__(self):
        return f"User {self.pk}"
    
    class Meta:  # type: ignore
        managed = True
        app_label = 'users'


class Case(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField()
    required_xp = models.IntegerField(validators=[MinValueValidator(0)])
    answer = models.CharField(max_length=50)

    def __str__(self):
        return f"Case {self.pk}: {self.title}"
    
    class Meta:
        managed = True
        app_label = 'users'


class AvailableTable(models.Model):
    case = models.ForeignKey(Case, on_delete=models.CASCADE)
    table = models.CharField(max_length=50)

    class Meta:
        app_label = 'users'
        unique_together = ('case', 'table')
        managed = True
    
    def __str__(self):
        return f"Table {self.table} for Case {self.case.pk}"


class UserProgress(TimeStampedModel):
    CASE_STATUS = [
    ('не начато', 'Не начато'),
    ('в процессе', 'В процессе'),
    ('завершено', 'Завершено'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    case = models.ForeignKey(Case, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=CASE_STATUS, default='не начато')
    answers = models.JSONField(default=dict)

    class Meta: # type: ignore
        app_label = 'users'
        unique_together = ('user', 'case')
        managed = True
    
    def clean(self):
        if self.user.xp < self.case.required_xp:
            raise ValidationError("Not enough experience to start this case.")
        
        if self.status not in [choice[0] for choice in self.CASE_STATUS]:
            raise ValidationError(f"Invalid status value: {self.status}")

    def __str__(self):
        return f"User {self.user} - Case {self.case} [{self.status}]"

    