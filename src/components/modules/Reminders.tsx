import { useState, useEffect } from 'react';
import { PlusIcon, BellIcon, TrashIcon, PencilIcon } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';

import { useRemindersStore, ReminderCategory, Reminder } from '@/store/reminders';
import {
  parseReminderDate,
  daysUntilDue,
  toInputDate,
  fromInputDate,
  reminderDueDate,
  CATEGORY_BADGE_LABELS,
} from '@/lib/reminderDates';

// Component to display and manage reminders
export function Reminders() {
  const { reminders, addReminder, updateReminder, removeReminder, getUpcomingReminders } =
    useRemindersStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ReminderCategory | 'all'>('all');
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  // Form state
  const [formLabel, setFormLabel] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formCategory, setFormCategory] = useState<ReminderCategory>('bas');
  const [formNotifyDays, setFormNotifyDays] = useState([7, 3, 1]);
  const [formNotes, setFormNotes] = useState('');

  // Auto-populate state
  const [selectedQuarter, setSelectedQuarter] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  // Filter reminders by category
  const filteredReminders =
    selectedCategory === 'all'
      ? reminders
      : reminders.filter((r) => r.category === selectedCategory);

  // Sort reminders by due date
  const sortedReminders = [...filteredReminders].sort((a, b) => {
    const dateA = parseReminderDate(a.dueDate);
    const dateB = parseReminderDate(b.dueDate);
    return (dateA?.getTime() ?? 0) - (dateB?.getTime() ?? 0);
  });

  const upcomingReminders = getUpcomingReminders(14);

  // Auto-populate due date when category, quarter, or year changes
  useEffect(() => {
    if (formCategory !== 'custom' && selectedQuarter && selectedYear) {
      const dueDate = reminderDueDate(formCategory, selectedQuarter, parseInt(selectedYear, 10));
      if (dueDate) {
        setFormDueDate(dueDate);

        // Auto-populate label if it's empty
        if (!formLabel) {
          let autoLabel = '';
          if (formCategory === 'bas') {
            autoLabel = `BAS ${selectedQuarter} FY${selectedYear}`;
          } else if (formCategory === 'tax_return') {
            autoLabel = `Tax Return FY${selectedYear}`;
          } else if (formCategory === 'superannuation') {
            autoLabel = `Super ${selectedQuarter} FY${selectedYear}`;
          }
          setFormLabel(autoLabel);
        }
      }
    } else if (formCategory === 'tax_return' && selectedYear) {
      // Tax return only needs year
      const dueDate = reminderDueDate(formCategory, '', parseInt(selectedYear, 10));
      if (dueDate) {
        setFormDueDate(dueDate);
        if (!formLabel) {
          setFormLabel(`Tax Return FY${selectedYear}`);
        }
      }
    }
  }, [formCategory, selectedQuarter, selectedYear, formLabel]);

  const resetForm = () => {
    setFormLabel('');
    setFormDueDate('');
    setFormCategory('bas');
    setFormNotifyDays([7, 3, 1]);
    setFormNotes('');
    setSelectedQuarter('');
    setSelectedYear(new Date().getFullYear().toString());
    setEditingReminderId(null);
  };

  const handleStartAdd = () => {
    resetForm();
    setShowAddForm(true);
  };

  const handleStartEdit = (reminder: Reminder) => {
    setFormLabel(reminder.label);
    setFormDueDate(toInputDate(reminder.dueDate));
    setFormCategory(reminder.category);
    setFormNotifyDays(reminder.notifyDaysBefore);
    setFormNotes(reminder.notes || '');
    setEditingReminderId(reminder.id);
    setShowAddForm(true);
  };

  const handleSave = () => {
    if (!formLabel || !formDueDate) return;

    const formattedDueDate = fromInputDate(formDueDate);
    if (!formattedDueDate) return;

    if (editingReminderId) {
      updateReminder(editingReminderId, {
        label: formLabel,
        dueDate: formattedDueDate,
        category: formCategory,
        notifyDaysBefore: formNotifyDays,
        notes: formNotes || undefined,
      });
    } else {
      addReminder({
        label: formLabel,
        dueDate: formattedDueDate,
        category: formCategory,
        notifyDaysBefore: formNotifyDays,
        notes: formNotes || undefined,
      });
    }

    setShowAddForm(false);
    resetForm();
  };

  const handleCancel = () => {
    setShowAddForm(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    removeReminder(id);
    setConfirmingDeleteId(null);
  };

  const handleNotifyDayToggle = (days: number) => {
    setFormNotifyDays((current) =>
      current.includes(days)
        ? current.filter((d) => d !== days)
        : [...current, days].sort((a, b) => b - a),
    );
  };

  const getCategoryStyle = (category: ReminderCategory): string => {
    switch (category) {
      case 'bas':
        return 'bg-blue-100 text-blue-800';
      case 'tax_return':
        return 'bg-emerald-100 text-emerald-800';
      case 'superannuation':
        return 'bg-purple-100 text-purple-800';
      case 'custom':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getDaysUntilLabel = (dueDate: string): { label: string; style: string } => {
    const daysUntil = daysUntilDue(dueDate);
    if (daysUntil === null) {
      return { label: 'Unknown', style: 'bg-slate-100 text-slate-800' };
    }
    if (daysUntil < 0) {
      return { label: `${Math.abs(daysUntil)} days overdue`, style: 'bg-red-100 text-red-800' };
    }
    if (daysUntil === 0) {
      return { label: 'Due today', style: 'bg-red-100 text-red-800' };
    }
    if (daysUntil <= 7) {
      return { label: `${daysUntil} days left`, style: 'bg-amber-100 text-amber-800' };
    }
    if (daysUntil <= 30) {
      return { label: `${daysUntil} days left`, style: 'bg-green-100 text-green-800' };
    }
    return { label: `${daysUntil} days left`, style: 'bg-slate-100 text-slate-800' };
  };

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
            <BellIcon className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-2xl">Lodgement Reminders</CardTitle>
            <CardDescription>
              Keep track of upcoming tax and business lodgement deadlines with customizable
              notifications
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {upcomingReminders.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Upcoming deadlines</h3>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
              {upcomingReminders.slice(0, 3).map((reminder) => {
                const dueInfo = getDaysUntilLabel(reminder.dueDate);
                return (
                  <div key={reminder.id} className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className={getCategoryStyle(reminder.category)}>
                          {CATEGORY_BADGE_LABELS[reminder.category]}
                        </Badge>
                        <span className="font-medium text-slate-900">{reminder.label}</span>
                      </div>
                      <p className="text-sm text-slate-700">Due {reminder.dueDate}</p>
                    </div>
                    <Badge className={dueInfo.style}>{dueInfo.label}</Badge>
                  </div>
                );
              })}
              {upcomingReminders.length > 3 && (
                <p className="text-xs text-slate-600">
                  +{upcomingReminders.length - 3} more upcoming deadlines
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="space-x-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All
            </Button>
            <Button
              variant={selectedCategory === 'bas' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('bas')}
            >
              BAS
            </Button>
            <Button
              variant={selectedCategory === 'tax_return' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('tax_return')}
            >
              Tax Returns
            </Button>
            <Button
              variant={selectedCategory === 'superannuation' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('superannuation')}
            >
              Super
            </Button>
            <Button
              variant={selectedCategory === 'custom' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('custom')}
            >
              Custom
            </Button>
          </div>

          <Button onClick={handleStartAdd} className="gap-2">
            <PlusIcon className="h-4 w-4" /> Add reminder
          </Button>
        </div>

        {showAddForm && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">
              {editingReminderId ? 'Edit Reminder' : 'Add New Reminder'}
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="label">Reminder Label</Label>
                <Input
                  id="label"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder="e.g. March Quarter BAS"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={formCategory === 'bas' ? 'default' : 'outline'}
                  onClick={() => setFormCategory('bas')}
                >
                  BAS Lodgement
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={formCategory === 'tax_return' ? 'default' : 'outline'}
                  onClick={() => setFormCategory('tax_return')}
                >
                  Tax Return
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={formCategory === 'superannuation' ? 'default' : 'outline'}
                  onClick={() => setFormCategory('superannuation')}
                >
                  Superannuation
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={formCategory === 'custom' ? 'default' : 'outline'}
                  onClick={() => setFormCategory('custom')}
                >
                  Custom
                </Button>
              </div>
            </div>

            {/* Auto-populate dropdowns based on category */}
            {(formCategory === 'bas' || formCategory === 'superannuation') && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="quarter">Quarter</Label>
                  <select
                    id="quarter"
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    value={selectedQuarter}
                    onChange={(e) => setSelectedQuarter(e.target.value)}
                  >
                    <option value="">Select quarter...</option>
                    <option value="Q1">Q1 (July - September)</option>
                    <option value="Q2">Q2 (October - December)</option>
                    <option value="Q3">Q3 (January - March)</option>
                    <option value="Q4">Q4 (April - June)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="financialYear">Financial Year</Label>
                  <select
                    id="financialYear"
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i).map(
                      (year) => (
                        <option key={year} value={year}>
                          {year}-{(year + 1).toString().slice(-2)}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>
            )}

            {formCategory === 'tax_return' && (
              <div className="space-y-2">
                <Label htmlFor="taxYear">Financial Year</Label>
                <select
                  id="taxYear"
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i).map(
                    (year) => (
                      <option key={year} value={year}>
                        {year}-{(year + 1).toString().slice(-2)}
                      </option>
                    ),
                  )}
                </select>
                <p className="text-xs text-slate-500">
                  Due date will be October 31 {parseInt(selectedYear) + 1}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Notification Preferences</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={formNotifyDays.includes(7) ? 'default' : 'outline'}
                  onClick={() => handleNotifyDayToggle(7)}
                >
                  7 days before
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={formNotifyDays.includes(3) ? 'default' : 'outline'}
                  onClick={() => handleNotifyDayToggle(3)}
                >
                  3 days before
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={formNotifyDays.includes(1) ? 'default' : 'outline'}
                  onClick={() => handleNotifyDayToggle(1)}
                >
                  1 day before
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={formNotifyDays.includes(0) ? 'default' : 'outline'}
                  onClick={() => handleNotifyDayToggle(0)}
                >
                  On due date
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Add any relevant details..."
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingReminderId ? 'Update Reminder' : 'Add Reminder'}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">All reminders</h3>
            {sortedReminders.length > 0 && (
              <span className="text-xs text-slate-500">{sortedReminders.length} total</span>
            )}
          </div>
          {sortedReminders.length === 0 ? (
            <Alert>No reminders found. Add your first reminder using the button above.</Alert>
          ) : (
            <div className="space-y-4">
              {sortedReminders.map((reminder) => {
                const dueInfo = getDaysUntilLabel(reminder.dueDate);
                return (
                  <div key={reminder.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className={getCategoryStyle(reminder.category)}>
                            {CATEGORY_BADGE_LABELS[reminder.category]}
                          </Badge>
                          <h3 className="text-lg font-semibold text-slate-900">{reminder.label}</h3>
                        </div>
                        <p className="text-sm text-slate-700">Due {reminder.dueDate}</p>
                        {reminder.notes && (
                          <p className="mt-2 text-sm text-slate-600">{reminder.notes}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className={dueInfo.style}>{dueInfo.label}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStartEdit(reminder)}
                          aria-label="Edit reminder"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setConfirmingDeleteId((current) =>
                              current === reminder.id ? null : reminder.id,
                            )
                          }
                          aria-label="Delete reminder"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-slate-500">
                        Will notify:{' '}
                        {reminder.notifyDaysBefore.length
                          ? reminder.notifyDaysBefore
                              .map((d) =>
                                d === 0 ? 'on due date' : `${d} day${d !== 1 ? 's' : ''} before`,
                              )
                              .join(', ')
                          : 'No notifications set'}
                      </p>
                      {confirmingDeleteId === reminder.id ? (
                        <div className="flex items-center justify-end gap-2 text-xs text-slate-600">
                          <span>Delete this reminder?</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmingDeleteId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(reminder.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
